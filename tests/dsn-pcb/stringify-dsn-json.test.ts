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

test("omits missing wire type when stringifying", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb missing-wire-type.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "9.0")
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
    (via Via[0-1]_600:300_um)
    (rule
      (width 100)
      (clearance 50)
    )
  )
  (placement)
  (library)
  (network
    (net N1
      (pins)
    )
    (class kicad_default "" N1
      (circuit
        (use_via Via[0-1]_600:300_um)
      )
      (rule
        (width 100)
        (clearance 50)
      )
    )
  )
  (wiring
    (wire
      (path F.Cu 100 0 0 1000 0)
      (net N1)
    )
  )
)`) as DsnPcb

  expect(dsnJson.wiring.wires[0].type).toBeUndefined()

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).not.toContain("undefined")
  expect(dsnString).not.toContain("(type undefined)")
  expect(dsnString).toContain(
    '(wire       (path F.Cu 100  0 0 1000 0)(net "N1"))',
  )

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.wiring.wires[0].type).toBeUndefined()
})
