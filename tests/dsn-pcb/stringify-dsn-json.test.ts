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

test("preserves autoroute via cost settings", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb test.dsn
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
        (path signal 0 0 0 1000 0 1000 1000 0 1000)
      )
      (via Via[0-1]_600:300_um)
      (autoroute_settings
        (via_costs 50)
        (plane_via_costs 5)
      )
      (rule
        (width 200)
        (clearance 200)
      )
    )
    (placement)
    (library)
    (network)
    (wiring)
  )`) as DsnPcb

  expect(dsnJson.structure.autoroute_settings).toEqual({
    via_costs: 50,
    plane_via_costs: 5,
  })

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).toContain("(via_costs 50)")
  expect(dsnString).toContain("(plane_via_costs 5)")

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.structure.autoroute_settings).toEqual(
    dsnJson.structure.autoroute_settings,
  )
})
