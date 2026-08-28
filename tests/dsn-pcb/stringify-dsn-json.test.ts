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

test("preserves net fromto circuit length constraints", () => {
  const dsn = `(pcb test.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "8.0.0")
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
      (path pcb 0 0 0 10000 0 10000 10000 0 10000 0 0)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 250)
      (clearance 200)
    )
  )
  (placement)
  (library)
  (network
    (net CLK1
      (pins U1-1 U2-1 U3-1)
      (fromto U1-1 (virtual_pin FP1)
        (circuit (length 350 300)))
      (fromto (virtual_pin FP1) U2-1)
    )
    (class kicad_default "" CLK1
      (circuit
        (use_via "Via[0-1]_600:300_um")
      )
      (rule
        (width 250)
        (clearance 200)
      )
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb

  expect(dsnJson.network.nets[0].fromtos).toEqual([
    {
      from: "U1-1",
      to: { virtual_pin: "FP1" },
      circuit: { length: [350, 300] },
    },
    {
      from: { virtual_pin: "FP1" },
      to: "U2-1",
    },
  ])

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(reparsedJson.network.nets[0].fromtos).toEqual(
    dsnJson.network.nets[0].fromtos,
  )
})
