import { describe, it, expect } from "vitest";
import { findResyncMatch } from "../src/utils/matching";

const words = (s) => s.split(/\s+/).map((w) => w.toLowerCase());

const TEXT = words(
  "one two three four five six seven eight nine ten " +
    "eleven twelve thirteen fourteen fifteen sixteen " +
    "seventeen eighteen nineteen twenty " +
    "next phrase begins here and continues for a while " +
    "yet another phrase with some words that repeat"
);

describe("findResyncMatch", () => {
  it("jumps past a skipped short phrase", () => {
    // currently on "two", speaker skips ahead to "eleven twelve"
    expect(findResyncMatch(TEXT, words("eleven twelve"), 1)).toBe(11);
  });

  it("jumps past a skipped phrase longer than the local lookahead", () => {
    // skips from "two" straight to "next phrase" (~20 words ahead)
    const res = findResyncMatch(TEXT, words("next phrase begins"), 1);
    expect(res).toBe(TEXT.indexOf("begins"));
  });

  it("prefers longer n-grams (does not match an earlier shorter pair)", () => {
    // "phrase ... phrase": a 2-gram "phrase begins" also exists later, but a
    // 3-gram must win with the closest exact sequence.
    const res = findResyncMatch(TEXT, words("phrase begins here"), 1);
    expect(res).toBe(TEXT.indexOf("here"));
  });

  it("returns the first match within a bounded window", () => {
    // far away beyond maxDistance -> no match
    expect(
      findResyncMatch(TEXT, words("words that repeat"), 1, { maxDistance: 10 })
    ).toBe(-1);
  });

  it("skips co-host words when skipWords is provided", () => {
    const text = words("hello world john speaks a lot here again hi there");
    const skipWords = text.map((w) => w === "john" || w === "speaks");
    // the spoken 2-gram "again hi" only matches right after the skipped block
    expect(findResyncMatch(text, words("again hi"), 0, { skipWords })).toBe(
      text.indexOf("hi")
    );
  });

  it("does not re-sync on a single token", () => {
    expect(findResyncMatch(TEXT, words("eleven"), 1)).toBe(-1);
  });

  it("respects minNGram for far searches", () => {
    // 2-gram exists far ahead but far search requires >=3 tokens
    expect(findResyncMatch(TEXT, words("some words"), 1, { minNGram: 3 })).toBe(
      -1
    );
    expect(
      findResyncMatch(TEXT, words("some words that"), 1, { minNGram: 3 })
    ).toBe(TEXT.indexOf("that"));
  });

  it("returns -1 when the spoken text is not in the script", () => {
    expect(findResyncMatch(TEXT, words("completely off script"), 1)).toBe(-1);
  });

  it("matches the accumulated interim transcript (fluent skip, no final)", () => {
    // During fluent reading only the last spoken word reaches the matcher,
    // but the accumulated transcript of the current interim result holds the
    // full phrase, which is what re-sync uses.
    expect(
      findResyncMatch(TEXT, words("another phrase with some words that"), 1)
    ).toBe(TEXT.indexOf("that"));
  });

  it("does not jump on a short filler pair when a strong word is required", () => {
    const text = words("and the cat sat on the mat and the dog jumped");
    // "and the" appears twice; without a strong word guard a jump to the
    // second occurrence would be wrong.
    expect(
      findResyncMatch(text, words("and the"), 1, { minStrongLen: 4 })
    ).toBe(-1);
    // but a 3-gram containing a strong word is fine
    expect(
      findResyncMatch(text, words("the dog jumped"), 1, { minStrongLen: 4 })
    ).toBe(text.indexOf("jumped"));
  });

  it("uses the last words of the transcript when it contains pre-skip text", () => {
    // transcript = tail of previous phrase + the new phrase being read;
    // re-sync slices the latest tokens so the pre-skip tail does not matter
    const text = words(
      "old phrase ending here new phrase begins now and continues along"
    );
    const transcript = words("here new phrase begins now");
    const res = findResyncMatch(text, transcript.slice(-8), 2, {
      minStrongLen: 4,
    });
    expect(res).toBe(text.indexOf("now"));
  });

  it("stays within endIndex (never jumps past the next paragraph)", () => {
    // three paragraphs of 4 words each
    const text = words(
      "one two three four five six seven eight nine ten eleven twelve"
    );
    const endOfParaTwo = 7; // last word index of the second paragraph
    expect(
      findResyncMatch(text, words("seven eight"), 0, { endIndex: endOfParaTwo })
    ).toBe(7);
    // the target lives in the third paragraph -> out of range
    expect(
      findResyncMatch(text, words("eleven twelve"), 0, {
        endIndex: endOfParaTwo,
      })
    ).toBe(-1);
    // without the bound it is reachable
    expect(findResyncMatch(text, words("eleven twelve"), 0)).toBe(11);
  });

  it("does not jump on a 2-gram that repeats in the next paragraph", () => {
    // "buenos dias" appears in both paragraphs; the speaker is mid-way
    // through the first one, so a 2-gram re-sync would wrongly land on the
    // second occurrence. The near re-sync requires a 3-gram, so no jump.
    const text = words(
      "hola buenos dias que tal esta usted hoy hola buenos dias me alegro verte"
    );
    expect(findResyncMatch(text, words("buenos dias"), 3, { minNGram: 3 })).toBe(
      -1
    );
    // a full repeated 3-gram is still a legitimate (rare) re-sync target
    expect(
      findResyncMatch(text, words("hola buenos dias me"), 3, { minNGram: 3 })
    ).toBe(text.indexOf("me"));
  });

  it("re-syncs when one word of the 3-gram is misrecognized", () => {
    // recognition heard "cuatr" (truncated) instead of "cuatro"; the other
    // two exact words still anchor the jump (minExact 2).
    const text = words("uno dos tres cuatro cinco seis");
    const spoken = words("dos tres cuatr");
    expect(
      findResyncMatch(text, spoken, 0, { minNGram: 3, minExact: 2 })
    ).toBe(3);
  });

  it("does not re-sync when two words of the 3-gram are misrecognized", () => {
    const text = words("uno dos tres cuatro cinco seis");
    const spoken = words("dos tress cuatr");
    expect(
      findResyncMatch(text, spoken, 0, { minNGram: 3, minExact: 2 })
    ).toBe(-1);
  });
});
