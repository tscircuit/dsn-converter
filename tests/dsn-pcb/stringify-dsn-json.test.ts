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

test("preserves class-level clearance class and via rule metadata", () => {
  const dsnString = `(pcb "class-metadata.dsn"
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
      (path F.Cu 0 0 0 1000 0 1000 1000 0 1000)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 200)
      (clearance 100)
    )
  )
  (placement)
  (library)
  (network
    (net "N1"
      (pins U1-1)
    )
    (class default "" "N1"
      (clearance_class default)
      (via_rule default)
      (circuit
        (use_via "Via[0-1]_600:300_um")
      )
      (rule
        (width 200)
        (clearance 100)
      )
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(dsnJson.network.classes[0].clearance_class).toBe("default")
  expect(dsnJson.network.classes[0].via_rule).toBe("default")

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain('(clearance_class "default")')
  expect(stringified).toContain('(via_rule "default")')

  const reparsedJson = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsedJson.network.classes[0].clearance_class).toBe("default")
  expect(reparsedJson.network.classes[0].via_rule).toBe("default")
})
