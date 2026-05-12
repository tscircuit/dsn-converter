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

test("round-trips rect and polygon structure boundaries", () => {
  const dsnWithBoundaryShapes = `(pcb boundary-shapes.dsn
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
      (rect pcb -10 -20 30 40)
    )
    (boundary
      (polygon signal 0 0 0 100 0 100 100 0 100)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 200)
      (clearance 200)
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsnWithBoundaryShapes) as DsnPcb

  expect(dsnJson.structure.boundaries).toHaveLength(2)
  expect(dsnJson.structure.boundaries?.[0].rect).toEqual({
    type: "pcb",
    coordinates: [-10, -20, 30, 40],
  })
  expect(dsnJson.structure.boundaries?.[1].polygon).toEqual({
    type: "signal",
    width: 0,
    coordinates: [0, 0, 100, 0, 100, 100, 0, 100],
  })

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb

  expect(reparsedJson.structure.boundaries).toEqual(
    dsnJson.structure.boundaries,
  )
  expect(reparsedJson.structure.boundary).toEqual(dsnJson.structure.boundary)
})
