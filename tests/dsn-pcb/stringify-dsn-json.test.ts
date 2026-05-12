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

test("parses numeric atoms in network pin lists as pin references", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb numeric-net-pins
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
    (via "")
    (rule
      (width 100)
    )
  )
  (placement)
  (library)
  (network
    (net "N1"
      (pins 1 U1-2 3)
    )
  )
  (wiring)
)`) as DsnPcb

  expect(dsnJson.network.nets[0].pins).toEqual(["1", "U1-2", "3"])

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb
  expect(reparsedJson.network.nets[0].pins).toEqual(["1", "U1-2", "3"])
})
