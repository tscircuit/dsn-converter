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
  convertCircuitJsonToDsnSession,
} from "lib"
import looksSame from "looks-same"
import { getTestDebugUtils } from "tests/fixtures/get-test-debug-utils"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { su } from "@tscircuit/soup-util"

test("merge-dsn-session-with-conversion", async () => {
  const { writeDebugFile, getDebugFilePath, debug } = getTestDebugUtils(
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
        pcbY={2}
        pcbRotation="90deg"
      />
      <trace from=".R1 .pin1" to=".R2 .pin1" />
    </board>,
  )

  const circuitJsonBefore = await circuit.getCircuitJson()
  debug("CIRCUIT JSON BEFORE\n------------------\n", circuitJsonBefore)
  const dsnFile = convertCircuitJsonToDsnString(circuitJsonBefore)
  debug("DSN FILE\n--------\n", dsnFile)
  writeDebugFile("original.dsn", dsnFile)
  const originalDsnPcb = parseDsnToDsnJson(dsnFile) as DsnPcb
  debug("ORIGINAL DSN PCB\n----------------\n", originalDsnPcb)

  // Create a PCB without traces by removing wiring section
  const dsnPcbWithoutTraces: DsnPcb = {
    ...originalDsnPcb,
    wiring: { wires: [] },
  }

  // Create a session from the original PCB's wiring
  const session: DsnSession = convertCircuitJsonToDsnSession(
    dsnPcbWithoutTraces,
    circuitJsonBefore,
  )

  debug("SESSION\n-------\n", session)

  // Merge session back into PCB without traces
  const mergedPcb = mergeDsnSessionIntoDsnPcb(dsnPcbWithoutTraces, session)

  debug("MERGED PCB\n------------\n", mergedPcb)

  // Convert both to circuit JSON for comparison
  const circuitJsonFromOriginal = convertDsnPcbToCircuitJson(originalDsnPcb)
  const circuitJsonFromMerged = convertDsnPcbToCircuitJson(mergedPcb)

  // Generate SVGs for visual comparison
  const svgOriginal = convertCircuitJsonToPcbSvg(circuitJsonFromOriginal)
  const svgMerged = convertCircuitJsonToPcbSvg(circuitJsonFromMerged)

  writeDebugFile("circuit.original.svg", svgOriginal)
  writeDebugFile("circuit.merged.svg", svgMerged)
  writeDebugFile(
    "circuit.original.json",
    JSON.stringify(circuitJsonFromOriginal),
  )
  writeDebugFile("circuit.merged.json", JSON.stringify(circuitJsonFromMerged))

  // Verify wiring was restored
  expect(mergedPcb.wiring.wires).toHaveLength(
    originalDsnPcb.wiring.wires.length,
  )

  // Compare the resulting circuit JSONs
  const originalTraces = su(circuitJsonFromOriginal).pcb_trace.list()
  const mergedTraces = su(circuitJsonFromMerged).pcb_trace.list()
  // expect(mergedTraces).toHaveLength(originalTraces.length)

  // Compare trace coordinates
  for (let i = 0; i < originalTraces.length; i++) {
    const originalTrace = originalTraces[i]
    const mergedTrace = mergedTraces[i]

    debug("ORIGINAL TRACE\n--------------\n", originalTrace)
    debug("MERGED TRACE\n--------------\n", mergedTrace)

    // Compare each route point
    // expect(mergedTrace.route.length).toBe(originalTrace.route.length)

    for (let j = 0; j < originalTrace.route.length; j++) {
      const originalPoint = originalTrace.route[j]
      const mergedPoint = mergedTrace.route[j]

      // Compare x,y coordinates with small tolerance for floating point differences
      // expect(Math.abs(mergedPoint.x - originalPoint.x)).toBeLessThan(0.0001)
      // expect(Math.abs(mergedPoint.y - originalPoint.y)).toBeLessThan(0.0001)

      // For wire points, also check width and layer
      // if (
      //   originalPoint.route_type === "wire" &&
      //   mergedPoint.route_type === "wire"
      // ) {
      // expect(mergedPoint.width).toBe(originalPoint.width)
      // expect(mergedPoint.layer).toBe(originalPoint.layer)
      // }
    }
  }

  // Compare SVGs
  const looksSameResult = await looksSame(
    getDebugFilePath("circuit.original.svg"),
    getDebugFilePath("circuit.merged.svg"),
  )
  expect(looksSameResult.equal).toBe(true) // Should be identical after merge
})
