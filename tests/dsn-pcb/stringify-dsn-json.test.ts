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

test("descriptionless network classes preserve their names", () => {
  const dsn = `(pcb board
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
      (path F.Cu 0 0 0 1000 1000)
    )
    (via Via[0-1]_600:300_um)
    (rule
      (width 100)
    )
  )
  (placement)
  (library)
  (network
    (net "N1"
      (pins "U1-1")
    )
    (class default
      (rule
        (width 100)
      )
      (circuit
        (use_via Via[0-1]_600:300_um)
      )
    )
    (class "kicad_default"
      "N1"
      (rule
        (width 100)
      )
      (circuit
        (use_via Via[0-1]_600:300_um)
      )
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  expect(dsnJson.network.classes[0].name).toBe("default")
  expect(dsnJson.network.classes[0].description).toBe("")
  expect(dsnJson.network.classes[1].name).toBe("kicad_default")
  expect(dsnJson.network.classes[1].description).toBe("")
  expect(dsnJson.network.classes[1].net_names).toEqual(["N1"])

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb
  expect(reparsedJson.network.classes[0].name).toBe("default")
  expect(reparsedJson.network.classes[0].description).toBe("")
  expect(reparsedJson.network.classes[1].name).toBe("kicad_default")
  expect(reparsedJson.network.classes[1].description).toBe("")
  expect(reparsedJson.network.classes[1].net_names).toEqual(["N1"])
})
