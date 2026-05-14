import { expect, test } from "bun:test"
import { tokenizeDsn } from "../../lib/common/parse-sexpr"

test("tokenizes voltage net names as symbols, not truncated numbers", () => {
  // Before fix: "3.3V" was tokenized as Number(3.3) + Symbol("V"), causing
  // net names like "3.3V" to be stored as "3.3" after the number parser consumed
  // the leading digits and dropped the trailing "V".
  const tokens = tokenizeDsn("(net 3.3V)")
  expect(tokens[2]).toEqual({ type: "Symbol", value: "3.3V" })

  const tokens2 = tokenizeDsn("(net 5V)")
  expect(tokens2[2]).toEqual({ type: "Symbol", value: "5V" })

  const tokens3 = tokenizeDsn("(net 12VREG)")
  expect(tokens3[2]).toEqual({ type: "Symbol", value: "12VREG" })

  const tokens4 = tokenizeDsn("(net -5V)")
  expect(tokens4[2]).toEqual({ type: "Symbol", value: "-5V" })
})

test("still parses plain numbers correctly", () => {
  const tokens = tokenizeDsn("(pin Rect 1 -650 3.14)")
  expect(tokens[3]).toEqual({ type: "Number", value: 1 })
  expect(tokens[4]).toEqual({ type: "Number", value: -650 })
  expect(tokens[5]).toEqual({ type: "Number", value: 3.14 })
})

test("parses scientific notation as numbers", () => {
  // (rule (clearance 5.68e-11)) → LParen Symbol LParen Symbol Number RParen RParen
  const tokens = tokenizeDsn("(rule (clearance 5.68e-11))")
  expect(tokens[4]).toEqual({ type: "Number", value: 5.68e-11 })

  const tokens2 = tokenizeDsn("(rule (clearance 1.2E+3))")
  expect(tokens2[4]).toEqual({ type: "Number", value: 1.2e3 })
})

test("smoothieboard net names are preserved after tokenizer fix", async () => {
  const { parseDsnToDsnJson } = await import("../../lib/index")
  // @ts-ignore
  const dsnText = await Bun.file(
    "tests/assets/repro/smoothieboard-repro.dsn",
  ).text()
  const dsnJson = parseDsnToDsnJson(dsnText) as any
  const netNames = (dsnJson.network?.nets ?? []).map((n: any) => n.name)
  expect(netNames).toContain("3.3V")
  expect(netNames).toContain("5V")
  expect(netNames).toContain("12VREG")
})
