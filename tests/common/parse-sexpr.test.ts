import { expect, test } from "bun:test"
import { parseSexprToAst, tokenizeDsn } from "../../lib/common/parse-sexpr"

test("tokenizes a bare DSN quote value without swallowing following content", () => {
  const ast = parseSexprToAst(tokenizeDsn('(parser (string_quote "))'))

  expect(ast.children?.[1]?.children?.[0]?.value).toBe("string_quote")
  expect(ast.children?.[1]?.children?.[1]?.value).toBe('"')
})

test("preserves quoted strings that begin with whitespace", () => {
  const ast = parseSexprToAst(tokenizeDsn('(net " GND" 1)'))

  expect(ast.children?.[0]?.value).toBe("net")
  expect(ast.children?.[1]?.value).toBe(" GND")
  expect(ast.children?.[2]?.value).toBe(1)
})
