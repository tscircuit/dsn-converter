import { expect, test } from "bun:test"
import {
  convertCircuitJsonToDsnString,
  mergeDsnSessionIntoDsnPcb,
  parseDsnToDsnJson,
} from "lib"

import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb, DsnSession } from "lib"
import circuitJson from "../assets/repro/motor-driver-breakout-circuit.json"

// @ts-ignore
import sessionFile from "../assets/repro/motor-driver-breakout-dsn.ses" with {
  type: "text",
}

/**
 * Part of https://github.com/tscircuit/dsn-converter/issues/54
 *
 * mergeDsnSessionIntoDsnPcb only copied a session net's `.wires` into the
 * merged PCB's wiring section, silently dropping `.vias` entirely. Any
 * layer-changing connection in a routed session (freerouting's own output,
 * or tscircuit's convertCircuitJsonToDsnSession) would disappear from the
 * merged board.
 */
test("mergeDsnSessionIntoDsnPcb preserves session net vias", () => {
  const dsnSession = parseDsnToDsnJson(sessionFile) as DsnSession

  const netsWithVias = dsnSession.routes.network_out.nets.filter(
    (n) => n.vias && n.vias.length > 0,
  )
  // Sanity check the fixture actually exercises this case
  expect(netsWithVias.length).toBeGreaterThan(0)
  const viaCountInSession = netsWithVias.reduce(
    (sum, n) => sum + (n.vias?.length ?? 0),
    0,
  )

  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )
  const dsnPcb = parseDsnToDsnJson(dsnFile) as DsnPcb

  const mergedPcb = mergeDsnSessionIntoDsnPcb(dsnPcb, dsnSession)

  const mergedVias = mergedPcb.wiring.wires.filter((w) => w.type === "via")
  expect(mergedVias.length).toBe(viaCountInSession)

  // Each merged via should carry its net name and a single-point path
  for (const via of mergedVias) {
    expect(via.net).toBeTruthy()
    expect(via.path?.coordinates).toHaveLength(2)
  }
})
