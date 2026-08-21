import { expect, test } from "bun:test"
import { tokenizeDsn } from "../../lib/common/parse-sexpr"

test("tokenizer parses number-like symbols correctly", () => {
  // "3.3V" should be a single Symbol, not Number(3.3) + Symbol("V")
  const tokens1 = tokenizeDsn("(net 3.3V)")
  expect(tokens1[2]).toEqual({ type: "Symbol", value: "3.3V" })

  // "5V" should be a single Symbol
  const tokens2 = tokenizeDsn("(net 5V)")
  expect(tokens2[2]).toEqual({ type: "Symbol", value: "5V" })

  // "-5V" should be a single Symbol
  const tokens3 = tokenizeDsn("(net -5V)")
  expect(tokens3[2]).toEqual({ type: "Symbol", value: "-5V" })

  // "12VREG" should be a single Symbol
  const tokens4 = tokenizeDsn("(net 12VREG)")
  expect(tokens4[2]).toEqual({ type: "Symbol", value: "12VREG" })
})

test("tokenizer still parses plain numbers correctly", () => {
  const tokens = tokenizeDsn("(pin Rect 1 -650 3.14)")
  expect(tokens[3]).toEqual({ type: "Number", value: 1 })
  expect(tokens[4]).toEqual({ type: "Number", value: -650 })
  expect(tokens[5]).toEqual({ type: "Number", value: 3.14 })
})

test("tokenizer handles scientific notation as numbers", () => {
  const tokens = tokenizeDsn("(pin Rect 1 5.68e-11 1.2E+3)")
  expect(tokens[3]).toEqual({ type: "Number", value: 1 })
  expect(tokens[4]).toEqual({ type: "Number", value: 5.68e-11 })
  expect(tokens[5]).toEqual({ type: "Number", value: 1.2e3 })
})
