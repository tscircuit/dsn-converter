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

test("stringify dsn json preserves placement refdes with spaces", () => {
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
    (placement
      (component "USB Connector"
        (place "J 1" 1250 2500 front 90)
      )
    )
    (library)
    (network)
    (wiring)
  )`) as DsnPcb

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  const place = reparsedJson.placement.components[0].places[0]

  expect(place.refdes).toBe("J 1")
  expect(place.x).toBe(1250)
  expect(place.y).toBe(2500)
  expect(place.side).toBe("front")
  expect(place.rotation).toBe(90)
})
