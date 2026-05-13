import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import dsnFileWithFreeroutingTrace from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("smoothieboard repro", async () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const smoothieVias = circuitJson.filter(
    (element) => element.type === "pcb_via",
  )

  expect(smoothieVias).toHaveLength(42)
  expect(new Set(smoothieVias.map((via) => via.pcb_via_id)).size).toBe(
    smoothieVias.length,
  )
  expect(new Set(smoothieVias.map((via) => via.pcb_trace_id)).size).toBe(1)
  expect(
    smoothieVias.every((via) => via.pcb_trace_id === "pcb_trace_AGND"),
  ).toBe(true)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
