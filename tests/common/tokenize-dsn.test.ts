import { test, expect } from "bun:test"
import { tokenizeDsn } from "lib/common/parse-sexpr"

test("tokenizeDsn returns tokens for simple input", () => {
  const result = tokenizeDsn("(symbol test)")
  expect(Array.isArray(result)).toBe(true)
  expect(result.length).toBeGreaterThan(0)
})
