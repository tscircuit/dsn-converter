import { test, expect } from "bun:test"
import { parseSexprToAst } from "lib/common/parse-sexpr"

test("parseSexprToAst exports function", async () => {
  const module = await import("lib/common/parse-sexpr")
  expect(typeof module.parseSexprToAst).toBe("function")
})
