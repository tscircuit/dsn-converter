import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

const makeDsn = (boundary: string) => `(pcb "boundary-shapes"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "test")
    (host_version "test")
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
    (layer Bottom
      (type signal)
      (property
        (index 1)
      )
    )
    (boundary
      ${boundary}
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`

test("parses rectangular board boundaries", () => {
  const dsnJson = parseDsnToDsnJson(
    makeDsn("(rect Top -1000 -500 3000 1500)"),
  ) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const board = circuitJson.find((elm) => elm.type === "pcb_board")

  expect(dsnJson.structure.boundary.rect).toEqual({
    type: "rect",
    layer: "Top",
    coordinates: [-1000, -500, 3000, 1500],
  })
  expect(board).toMatchObject({
    type: "pcb_board",
    center: { x: 1, y: 0.5 },
    width: 4,
    height: 2,
  })
})

test("parses polygon board boundaries", () => {
  const dsnJson = parseDsnToDsnJson(
    makeDsn("(polygon Top 0 0 0 4000 0 4000 2000 0 2000)"),
  ) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const board = circuitJson.find((elm) => elm.type === "pcb_board")

  expect(dsnJson.structure.boundary.polygon).toEqual({
    type: "polygon",
    layer: "Top",
    width: 0,
    coordinates: [0, 0, 4000, 0, 4000, 2000, 0, 2000],
  })
  expect(board).toMatchObject({
    type: "pcb_board",
    center: { x: 2, y: 1 },
    width: 4,
    height: 2,
  })
})
