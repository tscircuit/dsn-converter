import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

const dsnWithImageKeepouts = `(pcb "./image-keepout.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "9.0")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer Top
      (type signal)
      (property
        (index 0)
      )
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library
    (image "MountingHole"
      (keepout "" (circle Top 3600 10 -20))
      (via_keepout "hole-copper" (rect Bottom -10 -20 10 20))
    )
  )
  (network)
  (wiring)
)`

test("preserves image keepout descriptors", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithImageKeepouts) as DsnPcb
  const image = dsnJson.library.images[0]

  expect(image.keepouts).toEqual([
    {
      type: "keepout",
      name: "",
      shape: {
        shapeType: "circle",
        layer: "Top",
        values: [3600, 10, -20],
      },
    },
    {
      type: "via_keepout",
      name: "hole-copper",
      shape: {
        shapeType: "rect",
        layer: "Bottom",
        values: [-10, -20, 10, 20],
      },
    },
  ])

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain('(keepout "" (circle Top 3600 10 -20))')
  expect(stringified).toContain(
    '(via_keepout "hole-copper" (rect Bottom -10 -20 10 20))',
  )

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.library.images[0].keepouts).toEqual(image.keepouts)
})
