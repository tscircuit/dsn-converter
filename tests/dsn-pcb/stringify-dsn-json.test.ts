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

test("preserves generated_by_freerouting parser marker", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb freerouting-marker.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "9.0")
    (generated_by_freerouting)
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
    (class kicad_default ""
      (circuit
        (use_via Via[0-1]_600:300_um)
      )
      (rule
        (width 100)
        (clearance 50)
      )
    )
  )
  (wiring)
)`) as DsnPcb

  expect(dsnJson.parser.generated_by_freerouting).toBe(true)

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).toContain("(generated_by_freerouting)")

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.parser.generated_by_freerouting).toBe(true)
})
