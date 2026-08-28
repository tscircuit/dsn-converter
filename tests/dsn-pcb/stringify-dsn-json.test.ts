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

test("stringify dsn json preserves missing wiring net clauses", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb no-net-wires
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "")
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
    (layer B.Cu
      (type signal)
      (property
        (index 1)
      )
    )
    (boundary
      (path pcb 0  0 0 1000 0 1000 1000 0 1000)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 0)
    )
  )
  (placement)
  (library)
  (network)
  (wiring
    (wire (path F.Cu 100  0 0 1000 0)(type route))
    (via (path all 0  500 500))
  )
)`) as DsnPcb

  expect(dsnJson.wiring.wires.map((wire) => wire.net === undefined)).toEqual([
    true,
    true,
  ])

  const dsnString = stringifyDsnJson(dsnJson)

  expect(dsnString).not.toContain('(net "")')

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(
    reparsedJson.wiring.wires.map((wire) => wire.net === undefined),
  ).toEqual([true, true])
})
