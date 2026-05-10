import { expect, test } from "bun:test"
import { pcb_copper_pour, type PcbCopperPourPolygon } from "circuit-json"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieboardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("smoothieboard structure plane converts to pcb copper pour", () => {
  const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb

  expect(dsnJson.structure.planes).toHaveLength(1)
  expect(dsnJson.structure.planes?.[0]).toEqual({
    net_name: "AGND",
    polygon: {
      shapeType: "polygon",
      layer: "Route2",
      width: 0,
      coordinates: [
        214249, -158877, 82677, -159512, 82550, -50673, 214376, -50673, 214249,
        -158877,
      ],
    },
  })

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const copperPours = circuitJson.filter(
    (element): element is PcbCopperPourPolygon => {
      return element.type === "pcb_copper_pour" && element.shape === "polygon"
    },
  )

  expect(copperPours).toHaveLength(1)
  expect(copperPours[0]).toMatchObject({
    type: "pcb_copper_pour",
    pcb_copper_pour_id: "pcb_copper_pour_AGND_0",
    shape: "polygon",
    layer: "inner1",
    source_net_id: "source_net_AGND",
    covered_with_solder_mask: true,
  })
  expect(copperPours[0].points).toEqual([
    { x: 214.249, y: -158.877 },
    { x: 82.677, y: -159.512 },
    { x: 82.55, y: -50.673 },
    { x: 214.376, y: -50.673 },
    { x: 214.249, y: -158.877 },
  ])
  expect(pcb_copper_pour.parse(copperPours[0])).toEqual(copperPours[0])
})
