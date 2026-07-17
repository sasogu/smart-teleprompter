/*
 * POST /api/share — create a share link for a script.
 *
 * Runs as a Cloudflare Pages Function (deployed automatically because it
 * lives in the functions/ directory). Stores the script in a KV namespace
 * that must be bound to the Pages project with the name SHARES
 * (Dashboard -> Workers & Pages -> smart-teleprompter -> Settings ->
 *  Bindings -> KV namespace, variable name: SHARES).
 *
 * Free-tier friendly by design:
 *  - KV free plan allows 1,000 writes/day and 100,000 reads/day
 *  - shares auto-expire after 30 days (expirationTtl), so storage never grows
 *  - scripts are capped at 100 KB to keep well under KV's 25 MB value limit
 */

const MAX_TEXT_BYTES = 100 * 1024; // 100 KB per script
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Unambiguous alphabet (no 0/O, 1/l/I) => readable links
const ID_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

// Per-IP rate limit, stored in the same free-tier KV namespace: caps how
// many shares one origin can create per hour so a single bot/script can't
// burn through the KV free plan's 1,000 writes/day on its own.
const RATE_LIMIT_MAX = 20; // shares per IP per window
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60; // 1 hour

function randomId(len = 10) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ID_ALPHABET[b % ID_ALPHABET.length];
  return out;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function isRateLimited(env, ip) {
  const windowId = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  const key = `ratelimit:${ip}:${windowId}`;
  const current = parseInt((await env.SHARES.get(key)) || "0", 10);
  if (current >= RATE_LIMIT_MAX) return true;
  await env.SHARES.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
  });
  return false;
}

export async function onRequestPost({ request, env }) {
  // Graceful degradation: if the KV binding is missing the UI shows a
  // "not configured" message instead of a crash.
  if (!env.SHARES) return json({ error: "sharing_not_configured" }, 503);

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (await isRateLimited(env, ip)) {
    return json({ error: "rate_limited" }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: "invalid_json" }, 400);
  }

  const text = typeof body.text === "string" ? body.text : "";
  const title = (typeof body.title === "string" ? body.title : "")
    .trim()
    .slice(0, 200);
  const language = (
    typeof body.language === "string" ? body.language : "en-US"
  ).slice(0, 20);

  if (!text.trim()) return json({ error: "empty_text" }, 400);
  if (new TextEncoder().encode(text).length > MAX_TEXT_BYTES)
    return json({ error: "too_large" }, 413);

  const id = randomId();
  await env.SHARES.put(
    id,
    JSON.stringify({
      title,
      text,
      language,
      createdAt: new Date().toISOString(),
    }),
    { expirationTtl: TTL_SECONDS }
  );

  return json({ id, expiresInDays: 30 });
}
