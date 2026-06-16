import { expect, test } from "bun:test"
import { parseSexprToAst, tokenizeDsn } from "../../lib/common/parse-sexpr"

test("tokenizeDsn treats voltage-style net names as symbols, not split numbers", () => {
  const tokens = tokenizeDsn("(network (net 3.3V) (net 5V) (net 12VREG) (net -5V) (point -12.5 3.14 5.68e-11))")

  expect(tokens).toContainEqual({ type: "Symbol", value: "3.3V" })
  expect(tokens).toContainEqual({ type: "Symbol", value: "5V" })
  expect(tokens).toContainEqual({ type: "Symbol", value: "12VREG" })
  expect(tokens).toContainEqual({ type: "Symbol", value: "-5V" })
  expect(tokens).toContainEqual({ type: "Number", value: -12.5 })
  expect(tokens).toContainEqual({ type: "Number", value: 3.14 })
  expect(tokens).toContainEqual({ type: "Number", value: 5.68e-11 })
})

test("parseSexprToAst preserves number-like net atom values", () => {
  const ast = parseSexprToAst(tokenizeDsn("(network (net 3.3V) (net 5V) (net 12VREG))"))

  expect(ast).toEqual({
    type: "List",
    children: [
      { type: "Atom", value: "network" },
      {
        type: "List",
        children: [
          { type: "Atom", value: "net" },
          { type: "Atom", value: "3.3V" },
        ],
      },
      {
        type: "List",
        children: [
          { type: "Atom", value: "net" },
          { type: "Atom", value: "5V" },
        ],
      },
      {
        type: "List",
        children: [
          { type: "Atom", value: "net" },
          { type: "Atom", value: "12VREG" },
        ],
      },
    ],
  })
})
