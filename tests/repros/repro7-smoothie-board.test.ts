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
  const copperPours = circuitJson.filter(
    (element) => element.type === "pcb_copper_pour",
  )

  expect(dsnJson.structure.planes).toHaveLength(1)
  expect(copperPours).toContainEqual(
    expect.objectContaining({
      type: "pcb_copper_pour",
      layer: "inner1",
      shape: "polygon",
      source_net_id: "source_net_AGND",
    }),
  )

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
