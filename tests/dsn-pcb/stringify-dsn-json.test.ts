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

test("stringify dsn json preserves nets without pins", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb empty-net.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad")
    (host_version "8")
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
    (via "Via[0-0]")
    (rule
      (width 100)
    )
  )
  (placement)
  (library)
  (network
    (net "N/C")
  )
  (wiring)
)`) as DsnPcb

  expect(dsnJson.network.nets[0]).toEqual({ name: "N/C", pins: [] })

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).toContain('(net "N/C"')
  expect(dsnString).not.toContain("(pins")

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.network.nets[0]).toEqual({ name: "N/C", pins: [] })
})
