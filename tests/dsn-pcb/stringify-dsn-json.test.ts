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

test("preserves padstack hole descriptors when stringifying dsn json", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb hole-test
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "9.0")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu (type signal) (property (index 0)))
    (layer B.Cu (type signal) (property (index 1)))
    (boundary (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0))
    (via "Via[0-1]_600:300_um")
    (rule (width 100) (clearance 100))
  )
  (placement)
  (library
    (padstack "RoundHole"
      (shape (circle F.Cu 600))
      (hole (circle 300))
      (attach off)
    )
    (padstack "OvalHole"
      (shape (circle F.Cu 900))
      (hole (oval 300 500))
      (attach off)
    )
    (padstack "SquareHole"
      (shape (circle F.Cu 700))
      (hole (square 250 250))
      (attach off)
    )
  )
  (network)
  (wiring)
)`) as DsnPcb

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb

  expect(
    reparsedJson.library.padstacks.map((padstack) => padstack.hole),
  ).toEqual([
    { shape: "circle", diameter: 300 },
    { shape: "oval", width: 300, height: 500 },
    { shape: "square", width: 250, height: 250 },
  ])
})
