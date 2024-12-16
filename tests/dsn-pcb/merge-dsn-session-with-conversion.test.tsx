import { test, expect } from "bun:test"
import { Circuit } from "@tscircuit/core"
import {
  convertCircuitJsonToDsnString,
  convertDsnPcbToCircuitJson,
  parseDsnToDsnJson,
  mergeDsnSessionIntoDsnPcb,
  convertDsnSessionToCircuitJson,
  type DsnPcb,
  type DsnSession,
} from "lib"
import looksSame from "looks-same"
import { getTestDebugUtils } from "tests/fixtures/get-test-debug-utils"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { su } from "@tscircuit/soup-util"

test("merge-dsn-session-with-conversion", async () => {
  const { writeDebugFile, getDebugFilePath } = getTestDebugUtils(
    import.meta.path,
  )

  // Create initial circuit with two resistors
  const circuit = new Circuit()
  circuit.add(
    <board width="6mm" height="6mm">
      <resistor name="R1" footprint="0402" resistance="1k" pcbX={-2} />
      <resistor
        name="R2"
        footprint="0402"
        resistance="1k"
        layer="bottom"
        pcbX={2}
        pcbRotation="90deg"
      />
      <trace from=".R1 .pin1" to=".R2 .pin1" />
    </board>,
  )

  const circuitJsonBefore = await circuit.getCircuitJson()
  const dsnFile = convertCircuitJsonToDsnString(circuitJsonBefore)
  const originalDsnPcb = parseDsnToDsnJson(dsnFile) as DsnPcb

  // Create a PCB without traces by removing wiring section
  const dsnPcbWithoutTraces: DsnPcb = {
    ...originalDsnPcb,
    wiring: { wires: [] },
  }

  // Create a session from the original PCB's wiring
  const session: DsnSession = {
    is_dsn_session: true,
    filename: "test_session",
    placement: {
      resolution: originalDsnPcb.resolution,
      components: originalDsnPcb.placement.components,
    },
    routes: {
      resolution: originalDsnPcb.resolution,
      parser: originalDsnPcb.parser,
      network_out: {
        nets: originalDsnPcb.network.nets.map((net) => ({
          name: net.name,
          wires: originalDsnPcb.wiring.wires.filter((w) => w.net === net.name),
        })),
      },
    },
  }

  // Merge session back into PCB without traces
  const mergedPcb = mergeDsnSessionIntoDsnPcb(dsnPcbWithoutTraces, session)
  
  // Convert both to circuit JSON for comparison
  const circuitJsonFromOriginal = convertDsnPcbToCircuitJson(originalDsnPcb)
  const circuitJsonFromMerged = convertDsnPcbToCircuitJson(mergedPcb)

  // Generate SVGs for visual comparison
  const svgOriginal = convertCircuitJsonToPcbSvg(circuitJsonFromOriginal)
  const svgMerged = convertCircuitJsonToPcbSvg(circuitJsonFromMerged)

  writeDebugFile("circuit.original.svg", svgOriginal)
  writeDebugFile("circuit.merged.svg", svgMerged)
  writeDebugFile("circuit.original.json", JSON.stringify(circuitJsonFromOriginal))
  writeDebugFile("circuit.merged.json", JSON.stringify(circuitJsonFromMerged))

  // Verify wiring was restored
  expect(mergedPcb.wiring.wires).toHaveLength(
    originalDsnPcb.wiring.wires.length,
  )

  // Compare the resulting circuit JSONs
  const originalTraces = su(circuitJsonFromOriginal).pcb_trace.list()
  const mergedTraces = su(circuitJsonFromMerged).pcb_trace.list()
  expect(mergedTraces).toHaveLength(originalTraces.length)

  // Compare SVGs
  const looksSameResult = await looksSame(
    getDebugFilePath("circuit.original.svg"),
    getDebugFilePath("circuit.merged.svg"),
  )
  expect(looksSameResult.equal).toBe(true) // Should be identical after merge
})
