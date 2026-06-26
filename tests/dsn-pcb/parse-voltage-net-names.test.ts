import { expect, test } from "bun:test"
import { tokenizeDsn } from "lib/common/parse-sexpr"
import { parseDsnToDsnJson } from "lib"
import type { DsnPcb } from "lib"

// @ts-ignore
import smoothieboardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("tokenizer parses voltage-style net names as symbols, not number+symbol", () => {
  const tokens = tokenizeDsn("(net 3.3V) (net 5V) (net 12VREG) (net -5.5V_REG)")

  // Find the net name tokens (after the 'net' symbol in each group)
  const netNameTokens = tokens.filter(
    (t, i) =>
      i > 0 && tokens[i - 1].type === "Symbol" && tokens[i - 1].value === "net",
  )

  expect(netNameTokens).toHaveLength(4)
  expect(netNameTokens[0]).toEqual({ type: "Symbol", value: "3.3V" })
  expect(netNameTokens[1]).toEqual({ type: "Symbol", value: "5V" })
  expect(netNameTokens[2]).toEqual({ type: "Symbol", value: "12VREG" })
  expect(netNameTokens[3]).toEqual({ type: "Symbol", value: "-5.5V_REG" })
})

test("tokenizer still parses plain numbers correctly", () => {
  const tokens = tokenizeDsn("(x 3.5) (y -200) (z 0.0)")

  const numberTokens = tokens.filter((t) => t.type === "Number")
  expect(numberTokens).toHaveLength(3)
  expect(numberTokens[0]).toEqual({ type: "Number", value: 3.5 })
  expect(numberTokens[1]).toEqual({ type: "Number", value: -200 })
  expect(numberTokens[2]).toEqual({ type: "Number", value: 0.0 })
})

test("smoothieboard DSN nets include voltage-style net names (3.3V, 5V, 12VREG)", () => {
  const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
  const netNames = dsnJson.network?.nets?.map((n: any) => n.name) ?? []

  expect(netNames).toContain("3.3V")
  expect(netNames).toContain("5V")
  expect(netNames).toContain("12VREG")
})
