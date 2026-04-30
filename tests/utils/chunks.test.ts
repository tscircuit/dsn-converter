import { test, expect } from "bun:test"
import { chunks } from "lib/utils/chunks"

test("chunks splits array into groups", () => {
  const result = chunks([1, 2, 3, 4, 5], 2)
  expect(result).toEqual([[1, 2], [3, 4], [5]])
})

test("chunks handles empty array", () => {
  expect(chunks([], 2)).toEqual([])
})

test("chunks handles exact division", () => {
  expect(chunks([1, 2, 3, 4], 2)).toEqual([
    [1, 2],
    [3, 4],
  ])
})
