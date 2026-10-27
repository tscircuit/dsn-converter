import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import type {
  AnyCircuitElement,
  PcbSmtPad,
  PcbTrace,
  PcbTraceRoutePointWire,
} from "circuit-json"
import {
  type DsnPcb,
  type DsnSession,
  convertCircuitJsonToDsnString,
  convertDsnPcbToCircuitJson,
  mergeDsnSessionIntoDsnPcb,
  parseDsnToDsnJson,
} from "lib"
// @ts-ignore
import pcbDsnFile from "../assets/freerouting-sessions/circuit1.dsn" with {
  type: "text",
}
// @ts-ignore
import sessionFile from "../assets/freerouting-sessions/session1.ses" with {
  type: "text",
}
// @ts-ignore
import thicknessSessionFile from "../assets/repro/thickness-of-trace.ses" with {
  type: "text",
}

test("mergeDsnSessionIntoDsnPcb scales wire width, placement coordinates, and session padstacks from ses units to pcb um units", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={10} height={10}>
      <resistor resistance={1000} name="R1" footprint={"0402"} pcbX={-3} />
      <resistor resistance={1000} name="R2" footprint={"0402"} pcbX={3} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" thickness={0.3} />
      <trace from=".R1 > .pin2" to=".R2 > .pin2" />
    </board>,
  )

  const dsnSession = parseDsnToDsnJson(thicknessSessionFile) as DsnSession
  const dsnFile = convertCircuitJsonToDsnString(
    circuit.getCircuitJson() as AnyCircuitElement[],
  )
  const dsnPcb = parseDsnToDsnJson(dsnFile) as DsnPcb
  const mergedPcb = mergeDsnSessionIntoDsnPcb(dsnPcb, dsnSession)

  expect(mergedPcb.placement.components[0].places[0].x).toBe(-3000)
  expect(mergedPcb.placement.components[0].places[1].x).toBe(3000)
  expect(mergedPcb.wiring.wires[0].path?.width).toBe(300)

  const circuitJson = convertDsnPcbToCircuitJson(mergedPcb)
  const pcbTrace = circuitJson.find(
    (element) => element.type === "pcb_trace",
  ) as PcbTrace
  expect((pcbTrace.route[0] as PcbTraceRoutePointWire).width).toBe(0.3)

  const pads = circuitJson.filter(
    (element): element is Extract<PcbSmtPad, { shape: "rect" }> =>
      element.type === "pcb_smtpad" && element.shape === "rect",
  )
  expect(pads).toHaveLength(4)
  expect(Math.max(...pads.map((p) => Math.abs(p.x)))).toBeLessThan(5)
})

test("mergeDsnSessionIntoDsnPcb scales library_out padstack shapes when adding missing session padstacks", () => {
  const pcbJson = parseDsnToDsnJson(pcbDsnFile) as DsnPcb
  pcbJson.library.padstacks = pcbJson.library.padstacks.filter(
    (p) => p.name !== "Via[0-1]_600:300_um",
  )
  const sessionJson = parseDsnToDsnJson(sessionFile) as DsnSession
  const mergedPcb = mergeDsnSessionIntoDsnPcb(pcbJson, sessionJson)

  const viaPadstacks = mergedPcb.library.padstacks.filter(
    (p) => p.name === "Via[0-1]_600:300_um",
  )
  expect(viaPadstacks).toHaveLength(1)
  const firstShape = viaPadstacks[0].shapes[0]
  expect(firstShape.shapeType).toBe("circle")
  if (firstShape.shapeType === "circle") {
    expect(firstShape.diameter).toBe(600)
  }
})
