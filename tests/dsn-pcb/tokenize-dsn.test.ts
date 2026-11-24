import { expect, test } from "bun:test"
import { tokenizeDsn } from "lib/common/parse-sexpr"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"

test("tokenize keeps symbols that begin with a dash as a single symbol", () => {
  const tokens = tokenizeDsn("(net -5V (pins A-1 B-2))")
  expect(tokens).toEqual([
    { type: "LParen" },
    { type: "Symbol", value: "net" },
    { type: "Symbol", value: "-5V" },
    { type: "LParen" },
    { type: "Symbol", value: "pins" },
    { type: "Symbol", value: "A-1" },
    { type: "Symbol", value: "B-2" },
    { type: "RParen" },
    { type: "RParen" },
  ])
})

test("tokenize still parses negative numbers", () => {
  const tokens = tokenizeDsn("(place U1 -100 -2.5 front 0)")
  expect(tokens[3]).toEqual({ type: "Number", value: -100 })
  expect(tokens[4]).toEqual({ type: "Number", value: -2.5 })
})

test("parse a net whose name begins with a dash", () => {
  const parsed = parseDsnToDsnJson(`(pcb test.dsn
    (network
      (net -5V (pins U1-3 U2-7))
      (net GND (pins U1-8))))`)
  if (!("network" in parsed)) throw new Error("expected a pcb DSN")
  expect(parsed.network.nets[0].name).toBe("-5V")
  expect(parsed.network.nets[0].pins).toEqual(["U1-3", "U2-7"])
  expect(parsed.network.nets[1].name).toBe("GND")
})
