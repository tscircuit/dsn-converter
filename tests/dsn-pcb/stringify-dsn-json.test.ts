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

test("stringify dsn json preserves classes without circuit blocks", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb optional_class_circuit
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
      (path pcb 0  0 0 1000 0 1000 1000 0 1000)
    )
    (via "")
    (rule
      (width 100)
    )
  )
  (placement)
  (library)
  (network
    (class no_circuit "" "Net-(R1-Pad1)"
      (rule
        (width 100)
      )
    )
  )
  (wiring)
)`) as DsnPcb

  expect(dsnJson.network.classes[0].circuit).toBeUndefined()

  const dsnString = stringifyDsnJson(dsnJson)

  expect(dsnString).toContain('(class "no_circuit" "" "Net-(R1-Pad1)"')
  expect(dsnString).not.toContain("(use_via")

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.network.classes[0].circuit).toBeUndefined()
  expect(reparsedJson.network.classes[0].net_names).toEqual(["Net-(R1-Pad1)"])
})
