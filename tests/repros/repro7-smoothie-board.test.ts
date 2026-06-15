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
  const sourcePorts = circuitJson.filter((elm) => elm.type === "source_port")
  const sourceTraces = circuitJson.filter((elm) => elm.type === "source_trace")

  expect(
    sourcePorts.some((port) => port.name === "RJ1-G+"),
    "rotated non-numeric pins should keep their DSN pin label",
  ).toBe(true)
  expect(sourcePorts.some((port) => port.name === "RJ1-NC")).toBe(true)
  expect(
    sourceTraces.find((trace) =>
      trace.connected_source_net_ids.includes(
        "source_net_/smoothieboard-5driver_3/LED1/REGOFF",
      ),
    )?.connected_source_port_ids.length,
  ).toBe(2)
  expect(
    sourceTraces.find((trace) =>
      trace.connected_source_net_ids.includes("source_net_Net-(RJ1-PadNC)"),
    )?.connected_source_port_ids.length,
  ).toBe(1)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
