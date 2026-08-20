import { expect, test } from "bun:test"
import { parseSexprToAst, tokenizeDsn } from "lib/common/parse-sexpr"

const parse = (text: string) => parseSexprToAst(tokenizeDsn(text))

test("standalone signs remain symbolic DSN atoms", () => {
  const plusPin = parse("(pin pad + 3000 0)")
  const minusPin = parse("(pin pad - -3000 0)")

  expect(plusPin.children?.map((node) => node.value)).toEqual([
    "pin",
    "pad",
    "+",
    3000,
    0,
  ])

  expect(minusPin.children?.map((node) => node.value)).toEqual([
    "pin",
    "pad",
    "-",
    -3000,
    0,
  ])
})

test("complete numeric syntax is classified without corrupting symbols", () => {
  const ast = parse("(values 1 -1 +2 3.14 -0.5 .25 1e-6 -2.5E+4 1A G+ G- P$1)")

  expect(ast.children?.map((node) => node.value)).toEqual([
    "values",
    1,
    -1,
    2,
    3.14,
    -0.5,
    0.25,
    0.000001,
    -25000,
    "1A",
    "G+",
    "G-",
    "P$1",
  ])
})
