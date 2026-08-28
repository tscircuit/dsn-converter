import { expect, test } from "bun:test"
import { scale } from "transformation-matrix"
import { convertKeepoutsToPcbKeepouts } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-keepouts-to-pcb-keepouts.ts"
import type { DsnPcb } from "../../lib/dsn-pcb/types.ts"

const pcb = {
  structure: {
    layers: [
      { name: "Top", type: "signal", property: { index: 0 } },
      { name: "Route2", type: "power", property: { index: 1 } },
      { name: "Route15", type: "signal", property: { index: 2 } },
      { name: "Bottom", type: "signal", property: { index: 3 } },
    ],
  },
  placement: {
    components: [
      {
        name: "TEST",
        places: [
          { refdes: "K1", x: 100000, y: -50000, side: "front", rotation: 0 },
        ],
      },
    ],
  },
  library: {
    images: [
      {
        name: "TEST",
        outlines: [],
        pins: [],
        keepouts: [
          { shape: "circle", layer: "Top", diameter: 1600, x: 0, y: -4500 },
          { shape: "circle", layer: "Route2", diameter: 1600, x: 0, y: -4500 },
        ],
      },
      // unplaced image: must be skipped
      {
        name: "ORPHAN",
        outlines: [],
        pins: [],
        keepouts: [
          { shape: "circle", layer: "Top", diameter: 3600, x: 0, y: 0 },
        ],
      },
    ],
    padstacks: [],
  },
} as unknown as DsnPcb

test("converts placed image keepouts to absolute pcb_keepout, skips unplaced", () => {
  const els = convertKeepoutsToPcbKeepouts(pcb, scale(1 / 1000)) as any[]

  // 2 from TEST (placed once); ORPHAN skipped
  expect(els.length).toBe(2)

  const first = els[0]
  expect(first.type).toBe("pcb_keepout")
  expect(first.shape).toBe("circle")
  // center = (compX + localX, compY + localY) * 1/1000 = (100, -54.5)
  expect(first.center.x).toBeCloseTo(100, 6)
  expect(first.center.y).toBeCloseTo(-54.5, 6)
  expect(first.radius).toBeCloseTo(0.8, 6) // 1600/2/1000
  expect(first.layers).toEqual(["top"])

  expect(els[1].layers).toEqual(["inner1"]) // Route2
})

test("emits keepouts for each placement of a shared image footprint", () => {
  const pcb = {
    structure: {
      layers: [
        { name: "Top", type: "signal", property: { index: 0 } },
        { name: "Bottom", type: "signal", property: { index: 3 } },
      ],
    },
    placement: {
      components: [
        {
          name: "SHARED",
          places: [
            { refdes: "K1", x: 10000, y: 0, side: "front", rotation: 0 },
            { refdes: "K2", x: 20000, y: 0, side: "front", rotation: 0 },
          ],
        },
      ],
    },
    library: {
      images: [
        {
          name: "SHARED",
          outlines: [],
          pins: [],
          keepouts: [
            { shape: "circle", layer: "Top", diameter: 1000, x: 0, y: 0 },
            { shape: "circle", layer: "Bottom", diameter: 1000, x: 0, y: 0 },
          ],
        },
      ],
      padstacks: [],
    },
  } as unknown as DsnPcb

  const els = convertKeepoutsToPcbKeepouts(pcb, scale(1 / 1000)) as any[]

  // 2 placements x 2 keepouts = 4
  expect(els.length).toBe(4)

  // ids are unique across placements
  const ids = els.map((e) => e.pcb_keepout_id)
  expect(new Set(ids).size).toBe(4)

  // K1's keepouts centered at x=10, K2's at x=20 (scaled from 10000/20000)
  const k1 = els.filter((e) => e.pcb_keepout_id.includes("_K1_"))
  const k2 = els.filter((e) => e.pcb_keepout_id.includes("_K2_"))
  expect(k1.length).toBe(2)
  expect(k2.length).toBe(2)
  expect(k1.every((e) => Math.abs(e.center.x - 10) < 1e-6)).toBe(true)
  expect(k2.every((e) => Math.abs(e.center.x - 20) < 1e-6)).toBe(true)
})
