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

test("preserves top-level network via rules", () => {
  const dsnWithViaRules = `(pcb via-rule-test
  (parser
    (string_quote "")
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
    (via "Via[0-1]_600:300_um")
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library)
  (network
    (net GND
      (pins U1-1)
    )
    (via_rule
      default "Via[0-1]_600:300_um"
    )
    (via_rule
      "fine_pitch" "Via[0-1]_300:150_um"
    )
    (class default "" GND
      (circuit
        (use_via default)
      )
      (rule
        (width 100)
        (clearance 100)
      )
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsnWithViaRules) as DsnPcb

  expect(dsnJson.network.via_rules).toEqual([
    { name: "default", padstack: "Via[0-1]_600:300_um" },
    { name: "fine_pitch", padstack: "Via[0-1]_300:150_um" },
  ])

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb

  expect(reparsedJson.network.via_rules).toEqual(dsnJson.network.via_rules)
})
