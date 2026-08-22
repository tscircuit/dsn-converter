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

test("preserves structure place_boundary shapes", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb sample.dsn
  (parser
    (host_version "test")
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
    (place_boundary (rect signal -500 -400 500 400))
    (via "Via[0-0]_600:300_um")
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`) as DsnPcb

  expect(dsnJson.structure.place_boundaries).toEqual([
    {
      shapeType: "rect",
      layer: "signal",
      coordinates: [-500, -400, 500, 400],
    },
  ])

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).toContain(
    "(place_boundary (rect signal -500 -400 500 400))",
  )

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.structure.place_boundaries).toEqual(
    dsnJson.structure.place_boundaries,
  )
})
