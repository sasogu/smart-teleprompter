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
});
