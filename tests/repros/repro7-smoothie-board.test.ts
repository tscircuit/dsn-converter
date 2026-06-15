import { expect, test } from "bun:test"
import type { PcbPort, PcbSmtPad } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import dsnFileWithFreeroutingTrace from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("smoothieboard repro", async () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const jp36Pad1 = circuitJson.find(
    (element) =>
      element.type === "pcb_smtpad" &&
      element.pcb_smtpad_id ===
        "pcb_smtpad_Jumper:SolderJumper-2_P1.3mm_Open_RoundedPad1.0x1.5mm_JP36_0",
  ) as PcbSmtPad | undefined
  const jp36Pad2 = circuitJson.find(
    (element) =>
      element.type === "pcb_smtpad" &&
      element.pcb_smtpad_id ===
        "pcb_smtpad_Jumper:SolderJumper-2_P1.3mm_Open_RoundedPad1.0x1.5mm_JP36_1",
  ) as PcbSmtPad | undefined
  const jp36Port1 = circuitJson.find(
    (element) =>
      element.type === "pcb_port" &&
      element.pcb_port_id ===
        "pcb_port_Jumper:SolderJumper-2_P1.3mm_Open_RoundedPad1.0x1.5mm-Pad1_JP36",
  ) as PcbPort | undefined

  expect(jp36Pad1).toMatchObject({
    type: "pcb_smtpad",
    shape: "rotated_rect",
    x: 123.736,
    ccw_rotation: 270,
    pcb_component_id:
      "Jumper:SolderJumper-2_P1.3mm_Open_RoundedPad1.0x1.5mm_JP36",
  })
  expect((jp36Pad1 as any)?.y).toBeCloseTo(-88.6691, 4)
  expect(jp36Pad2).toMatchObject({
    type: "pcb_smtpad",
    shape: "rotated_rect",
    x: 123.736,
    ccw_rotation: 270,
  })
  expect((jp36Pad2 as any)?.y).toBeCloseTo(-89.9691, 4)
  expect(jp36Port1).toMatchObject({
    type: "pcb_port",
    x: 123.736,
    pcb_component_id:
      "Jumper:SolderJumper-2_P1.3mm_Open_RoundedPad1.0x1.5mm_JP36",
  })
  expect(jp36Port1?.y).toBeCloseTo(-88.6691, 4)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
