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

test("stringify dsn json preserves layer direction and cost", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb "layer-metadata.dsn"
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
      (direction horizontal)
      (cost 7)
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
  (placement)
  (library)
  (network)
  (wiring)
)`) as DsnPcb

  expect(dsnJson.structure.layers[0].direction).toBe("horizontal")
  expect(dsnJson.structure.layers[0].cost).toBe(7)

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).toContain("(direction horizontal)")
  expect(dsnString).toContain("(cost 7)")

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.structure.layers[0].direction).toBe("horizontal")
  expect(reparsedJson.structure.layers[0].cost).toBe(7)
})
