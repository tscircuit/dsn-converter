import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

const dsnWithPlane = `(pcb "plane-test.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "(5.1.9)-1")
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
    (layer Route2
      (type power)
      (property
        (index 1)
      )
    )
    (boundary
      (path pcb 0  0 0  10000 0  10000 10000  0 10000  0 0)
    )
    (plane AGND (polygon Route2 0  0 0  10000 0  10000 10000  0 10000  0 0))
    (via "Via[0-1]_800:400_um")
    (rule
      (width 250)
      (clearance 200.1)
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`

test("preserves structure plane polygons", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithPlane) as DsnPcb

  expect(dsnJson.structure.planes).toEqual([
    {
      net: "AGND",
      shape: {
        shapeType: "polygon",
        layer: "Route2",
        width: 0,
        coordinates: [0, 0, 10000, 0, 10000, 10000, 0, 10000, 0, 0],
      },
    },
  ])

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb
  expect(reparsedJson.structure.planes).toEqual(dsnJson.structure.planes)
})
