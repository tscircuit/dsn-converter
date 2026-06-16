import { expect, test } from "bun:test"
import type { DsnPcb } from "lib"
import {
  convertDsnPcbToCircuitJson,
  parseDsnToCircuitJson,
  parseDsnToDsnJson,
} from "lib"

// @ts-ignore
import smoothieBoardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

const dsnWithImageKeepouts = `
(pcb keepout_fixture
  (resolution um 10)
  (unit um)
  (structure
    (layer Top (type signal) (property (index 0)))
    (layer Route2 (type signal) (property (index 1)))
    (layer Bottom (type signal) (property (index 2)))
    (boundary (path pcb 0 0 0 3000 0 3000 3000 0 3000 0 0))
  )
  (placement
    (component KEEPOUT_IMAGE
      (place K1 1000 2000 front 0)
    )
  )
  (library
    (image KEEPOUT_IMAGE
      (keepout "mounting hole" (circle Top 1000 200 -300))
      (keepout "inner keepout" (circle Route2 600))
    )
  )
  (network)
  (wiring)
)
`

test("converts DSN image circle keepouts into placed pcb_keepout elements", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithImageKeepouts) as DsnPcb
  expect(dsnJson.library.images[0].keepouts).toHaveLength(2)

  const circuitJson = parseDsnToCircuitJson(dsnWithImageKeepouts)
  const keepouts = circuitJson.filter(
    (element) => element.type === "pcb_keepout",
  ) as any[]

  expect(keepouts).toHaveLength(2)
  expect(keepouts[0]).toMatchObject({
    type: "pcb_keepout",
    pcb_keepout_id: "pcb_keepout_KEEPOUT_IMAGE_K1_0",
    shape: "circle",
    center: { x: 1.2, y: 1.7 },
    radius: 0.5,
    layers: ["top"],
    description: "mounting hole",
  })
  expect(keepouts[1]).toMatchObject({
    center: { x: 1, y: 2 },
    radius: 0.3,
    layers: ["inner1"],
    description: "inner keepout",
  })
})

test("preserves Smoothie Board library keepouts", () => {
  const dsnJson = parseDsnToDsnJson(smoothieBoardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const keepouts = circuitJson.filter(
    (element) => element.type === "pcb_keepout",
  ) as any[]

  const hole0Keepouts = keepouts.filter(
    (keepout) => keepout.center.x === 185.458 && keepout.center.y === -55.7911,
  )

  expect(keepouts.length).toBeGreaterThan(16)
  expect(hole0Keepouts).toHaveLength(4)
  expect(hole0Keepouts.map((keepout) => keepout.layers[0]).sort()).toEqual([
    "bottom",
    "inner1",
    "inner2",
    "top",
  ])
  expect(hole0Keepouts.every((keepout) => keepout.radius === 1.8)).toBe(true)
})
