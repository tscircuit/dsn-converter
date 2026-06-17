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

test("stringify dsn json preserves placement pin clearance classes", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb "freerouting-output.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "freerouting")
    (host_version "1.9")
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
      (path pcb 0 0 0 1000 0 1000 1000 0 1000)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 200)
      (clearance 200)
    )
  )
  (placement
    (component "R_0402"
      (place R1 156105 -105000 front 0
        (pin 1 (clearance_class "kicad_default"))
        (pin 2 (clearance_class "fine_pitch"))
      )
    )
  )
  (library)
  (network)
  (wiring)
)`) as DsnPcb

  const place = dsnJson.placement.components[0].places[0]
  expect(place.pins).toEqual([
    { pin_number: 1, clearance_class: "kicad_default" },
    { pin_number: 2, clearance_class: "fine_pitch" },
  ])

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).toContain('(pin 1 (clearance_class "kicad_default"))')
  expect(dsnString).toContain('(pin 2 (clearance_class "fine_pitch"))')

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.placement.components[0].places[0].pins).toEqual(
    place.pins,
  )
})
