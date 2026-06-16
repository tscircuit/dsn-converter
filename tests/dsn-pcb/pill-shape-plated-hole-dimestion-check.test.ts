import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"

import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"
import circuitJson from "../assets/repro/pill-shaped-plated-hole.json"

test("check pill shape plated hole dimension", async () => {
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson2 = convertDsnJsonToCircuitJson(dsnJson)

  const platedHoles = circuitJson2.filter(
    (e) => e.type === "pcb_plated_hole",
  ) as any[]
  expect(platedHoles.length).toBe(1)

  const hole = platedHoles[0]
  expect(hole.shape).toBe("oval")
  expect(hole.outer_width).toBeCloseTo(1.2, 2)
  expect(hole.outer_height).toBeCloseTo(1.8, 2)
  expect(hole.hole_width).toBeCloseTo(0.8, 2)
  expect(hole.hole_height).toBeCloseTo(1.4, 2)
})
