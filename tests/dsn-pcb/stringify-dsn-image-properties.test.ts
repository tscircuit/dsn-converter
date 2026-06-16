import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("preserves DSN library image property metadata", () => {
  const dsn = `(pcb "image-properties.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad")
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
    (via "Via[0-1]_600:300_um")
    (rule
      (width 200)
      (clearance 150)
    )
  )
  (placement)
  (library
    (image "Connector:Demo"
      (property
        (reference_prefix "J")
        (rotation 90)
      )
      (outline (path signal 50 0 0 1000 0))
      (pin "Rect[T]Pad_1000x500_um" "A1" 0 0)
    )
    (padstack "Rect[T]Pad_1000x500_um"
      (shape (rect F.Cu -500 -250 500 250))
      (attach off)
    )
  )
  (network)
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  expect(dsnJson.library.images[0].properties).toEqual([
    { key: "reference_prefix", value: "J" },
    { key: "rotation", value: 90 },
  ])

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).toContain('(reference_prefix "J")')
  expect(dsnString).toContain("(rotation 90)")

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.library.images[0].properties).toEqual(
    dsnJson.library.images[0].properties,
  )
})
