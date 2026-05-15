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

test("preserves placement component property metadata", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb component-property-test.dsn
    (parser
      (string_quote ")
      (space_in_quoted_tokens on)
      (host_cad "KiCad's Pcbnew")
      (host_version "8.0.3")
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
      (via "Via[0-1]_600:300_um")
      (rule
        (width 200)
        (clearance 200)
      )
    )
    (placement
      (component "Connector:USB_C_Receptacle"
        (property
          (source_library "Connector.pretty")
          (component_height 1200)
        )
        (place J1 1000 2000 front 90 (PN "USB-C"))
      )
    )
    (library
      (image "Connector:USB_C_Receptacle"
        (pin "RoundPad" 1 0 0)
      )
      (padstack "RoundPad"
        (shape (circle F.Cu 600))
        (attach off)
      )
    )
    (network
      (net "VBUS"
        (pins J1-1)
      )
      (class kicad_default "" "VBUS"
        (circuit
          (use_via "Via[0-1]_600:300_um")
        )
        (rule
          (width 200)
          (clearance 200)
        )
      )
    )
  )`) as DsnPcb

  expect(dsnJson.placement.components[0].properties).toEqual([
    { name: "source_library", value: "Connector.pretty" },
    { name: "component_height", value: 1200 },
  ])

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(reparsedJson.placement.components[0].properties).toEqual(
    dsnJson.placement.components[0].properties,
  )
})
