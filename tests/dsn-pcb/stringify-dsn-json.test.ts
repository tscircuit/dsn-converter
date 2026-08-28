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

test("preserves numeric class net references", () => {
  const dsnString = `(pcb numeric-class-net-refs.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "8.0")
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
      (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library)
  (network
    (net 1
      (pins U1-1)
    )
    (net 2
      (pins U2-1)
    )
    (class "kicad_default" "" 1 2
      (circuit
        (use_via "Via[0-1]_600:300_um")
      )
      (rule
        (width 100)
        (clearance 100)
      )
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(dsnJson.network.nets.map((net) => net.name)).toEqual([1, 2])
  expect(dsnJson.network.classes[0].net_names).toEqual([1, 2])

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb

  expect(reparsedJson.network.nets.map((net) => net.name)).toEqual([1, 2])
  expect(reparsedJson.network.classes[0].net_names).toEqual([1, 2])
})
