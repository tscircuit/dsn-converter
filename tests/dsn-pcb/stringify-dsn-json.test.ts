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

test("preserves wiring polyline_path records when stringifying", () => {
  const dsn = `(pcb "./polyline-wire.dsn"
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
    (via "")
    (rule
      (width 150)
    )
  )
  (placement)
  (library)
  (network
    (net N1
      (pins)
    )
  )
  (wiring
    (wire
      (polyline_path F.Cu 200 0 0 1000 0 1000 1000)
      (net N1)
      (type protect)
    )
  )
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  const [wire] = reparsedJson.wiring.wires

  expect(dsnString).toContain("(polyline_path F.Cu 200  0 0 1000 0 1000 1000)")
  expect(wire.polyline_path).toEqual({
    layer: "F.Cu",
    width: 200,
    coordinates: [0, 0, 1000, 0, 1000, 1000],
  })
  expect(wire.net).toBe("N1")
  expect(wire.type).toBe("protect")
})
