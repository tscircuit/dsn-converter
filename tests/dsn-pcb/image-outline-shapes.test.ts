import { expect, test } from "bun:test"
import { stringifyDsnJson } from "../../lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "../../lib/dsn-pcb/types"

const dsnWithNonPathOutlines = `(pcb outline_shapes
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
      (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
    )
    (via "")
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library
    (image outline_fixture
      (outline (rect F.SilkS -100 -50 100 50))
      (outline (polygon F.SilkS 0 -100 -100 100 -100 100 100 -100 100))
      (outline (circle F.SilkS 200))
      (pin Round_1000 1 0 0)
    )
  )
  (network)
  (wiring)
)`

test("preserves non-path image outlines in DSN JSON", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithNonPathOutlines) as DsnPcb
  const image = dsnJson.library.images[0]

  expect(image.outlines[0].shape).toEqual({
    shapeType: "rect",
    layer: "F.SilkS",
    coordinates: [-100, -50, 100, 50],
  })
  expect(image.outlines[1].shape).toEqual({
    shapeType: "polygon",
    layer: "F.SilkS",
    width: 0,
    coordinates: [-100, -100, 100, -100, 100, 100, -100, 100],
  })
  expect(image.outlines[2].shape).toEqual({
    shapeType: "circle",
    layer: "F.SilkS",
    diameter: 200,
  })
})

test("stringifies non-path image outlines", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithNonPathOutlines) as DsnPcb
  const dsnString = stringifyDsnJson(dsnJson)

  expect(dsnString).toContain(
    "(outline         (rect F.SilkS -100 -50 100 50))",
  )
  expect(dsnString).toContain(
    "(outline         (polygon F.SilkS 0 -100 -100 100 -100 100 100 -100 100))",
  )
  expect(dsnString).toContain("(outline         (circle F.SilkS 200))")
})

test("rejects unsupported image outlines instead of emitting empty DSN", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithNonPathOutlines) as DsnPcb
  dsnJson.library.images[0]!.outlines.push({} as any)

  expect(() => stringifyDsnJson(dsnJson)).toThrow(
    "Cannot stringify unsupported image outline",
  )
})
