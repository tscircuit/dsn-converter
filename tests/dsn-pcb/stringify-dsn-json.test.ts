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

test("stringify dsn json preserves library image pin identifiers with spaces", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb board.dsn
    (parser
      (string_quote ")
      (space_in_quoted_tokens on)
      (host_cad "KiCad")
      (host_version "1.0")
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
        (path F.Cu 0 0 0 1000 0 1000 1000 0 1000 0 0)
      )
      (via "Via[0-1]_600:300_um")
      (rule
        (width 100)
        (clearance 100)
      )
    )
    (placement)
    (library
      (image "USB Connector"
        (pin "Pad Stack A" "Pin A" 125 250)
      )
    )
    (network)
    (wiring)
  )`) as DsnPcb

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  const pin = reparsedJson.library.images[0].pins[0]

  expect(dsnString).toContain('(pin "Pad Stack A" "Pin A" 125 250)')
  expect(pin.padstack_name).toBe("Pad Stack A")
  expect(pin.pin_number).toBe("Pin A")
  expect(pin.x).toBe(125)
  expect(pin.y).toBe(250)
})
