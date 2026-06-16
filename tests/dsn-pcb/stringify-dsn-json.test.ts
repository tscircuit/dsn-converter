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

test("preserves placement mirror descriptors when stringifying dsn json", () => {
  const dsn = `(pcb mirror_fixture
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "fixture")
    (host_version "1")
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
    (via "Via[0-1]_600:300_um")
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement
    (component "Device"
      (place U1 100 200 front 90 (mirror X) (PN "controller"))
      (place U2 300 400 back 180 (mirror XY))
    )
  )
  (library
    (image "Device"
      (pin RoundPad 1 0 0)
    )
    (padstack RoundPad
      (shape (circle F.Cu 100))
      (attach off)
    )
  )
  (network
    (net "N1"
      (pins U1-1 U2-1)
    )
    (class "default" "" "N1"
      (circuit
        (use_via "Via[0-1]_600:300_um")
      )
      (rule
        (width 100)
        (clearance 100)
      )
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  expect(dsnJson.placement.components[0].places[0].mirror).toBe("X")
  expect(dsnJson.placement.components[0].places[1].mirror).toBe("XY")

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).toContain("(mirror X)")
  expect(dsnString).toContain("(mirror XY)")

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.placement.components[0].places[0].mirror).toBe("X")
  expect(reparsedJson.placement.components[0].places[1].mirror).toBe("XY")
})
