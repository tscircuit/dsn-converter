import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

const circAliasDsn = `(pcb circ-alias.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "test")
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
    (layer B.Cu
      (type signal)
      (property
        (index 1)
      )
    )
    (boundary
      (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
    )
    (via ViaAlias)
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library
    (padstack ViaAlias
      (shape (circ F.Cu 600))
      (shape (circ B.Cu 600))
      (attach off)
    )
  )
  (network)
  (wiring)
)`

test("parses SPECCTRA circ shape aliases as circle shapes", () => {
  const dsnJson = parseDsnToDsnJson(circAliasDsn) as DsnPcb
  const [padstack] = dsnJson.library.padstacks

  expect(padstack.shapes).toHaveLength(2)
  expect(padstack.shapes.map((shape) => shape.shapeType)).toEqual([
    "circle",
    "circle",
  ])
  expect(padstack.shapes).toEqual([
    { shapeType: "circle", layer: "F.Cu", diameter: 600 },
    { shapeType: "circle", layer: "B.Cu", diameter: 600 },
  ])
})

test("round-trips circ aliases through normalized circle output", () => {
  const dsnJson = parseDsnToDsnJson(circAliasDsn) as DsnPcb
  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(dsnString).toContain("(shape (circle F.Cu 600))")
  expect(reparsedJson.library.padstacks[0].shapes).toEqual(
    dsnJson.library.padstacks[0].shapes,
  )
})
