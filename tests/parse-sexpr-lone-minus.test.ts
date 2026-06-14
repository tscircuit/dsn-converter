import { expect, test } from "bun:test"
import { tokenizeDsn, parseSexprToAst } from "lib/common/parse-sexpr"

test("standalone minus sign is tokenized as Symbol, not Number", () => {
  const tokens = tokenizeDsn('(test -)')
  expect(tokens.find((t) => t.type === "Symbol" && t.value === "-")).toBeDefined()
  expect(tokens.find((t) => t.type === "Number" && t.value === "-")).toBeUndefined()
})

test("negative numbers still parse correctly", () => {
  const tokens = tokenizeDsn('(test -1.5)')
  const numToken = tokens.find((t) => t.type === "Number")
  expect(numToken).toBeDefined()
  expect(numToken!.value).toBe(-1.5)
})
