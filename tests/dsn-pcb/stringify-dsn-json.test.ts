import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}

test("stringify dsn json", () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile) as DsnPcb
  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  for (const key of Object.keys(reparsedJson) as Array<keyof DsnPcb>) {
    expect(reparsedJson[key]).toEqual(dsnJson[key] as any)
  }

  // Test that we can parse the generated string back to the same structure
  // expect(reparsedJson).toEqual(dsnJson)
})

const createDsnWithWiring = (wiring: string) => `(pcb board.dsn
  (parser
    (string_quote quote)
    (space_in_quoted_tokens on)
    (host_cad "test")
    (host_version "1")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
      (property
        (index 0)
      )
    )
    (boundary
      (path pcb 0 0 0 100 0 100 100 0 100 0 0)
    )
    (via Via_600)
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library)
  (network)
  (wiring
    ${wiring}
  )
)`

test("stringify dsn json preserves missing wire net metadata", () => {
  const dsnJson = parseDsnToDsnJson(
    createDsnWithWiring("(wire (path F.Cu 100 0 0 100 0) (type protect))"),
  ) as DsnPcb

  expect(dsnJson.wiring.wires[0].net).toBeUndefined()

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).not.toContain('(net "")')

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.wiring.wires[0].net).toBeUndefined()
})

test("stringify dsn json preserves missing via net metadata", () => {
  const dsnJson = parseDsnToDsnJson(
    createDsnWithWiring("(via Via_600 10 20)"),
  ) as DsnPcb

  expect(dsnJson.wiring.wires[0].net).toBeUndefined()

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).not.toContain('(net "")')

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.wiring.wires[0].net).toBeUndefined()
})
