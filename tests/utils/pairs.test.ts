import { test, expect } from "bun:test"
import { pairs } from "lib/utils/pairs"

test("pairs creates tuples from array", () => {
  expect(pairs([1, 2, 3, 4])).toEqual([
    [1, 2],
    [3, 4],
  ])
})

test("pairs handles odd length", () => {
  expect(pairs([1, 2, 3])).toEqual([
    [1, 2],
    [3, undefined],
  ])
})
