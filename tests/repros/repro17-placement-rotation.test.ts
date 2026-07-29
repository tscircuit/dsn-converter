import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieboardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

// A minimal two-pin footprint placed once at 0 degrees and once at 90 degrees.
// The pads sit on the x axis, so the rotated copy must end up on the y axis.
const rotatedPlacementDsn = `(pcb rotation-fixture
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "(5.1.9)-1")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
    )
    (layer B.Cu
      (type signal)
    )
    (boundary
      (path pcb 0  0 0  10000 0  10000 10000  0 10000  0 0)
    )
  )
  (placement
    (component TWOPAD
      (place U1 0 0 front 0 (PN PART))
      (place U2 5000 5000 front 90 (PN PART))
    )
  )
  (library
    (image TWOPAD
      (pin RECT_PAD 1 -1000 0)
      (pin RECT_PAD 2 1000 0)
    )
    (padstack RECT_PAD
      (shape (rect F.Cu -500 -250 500 250))
      (attach off)
    )
  )
  (network
  )
  (wiring
  )
)
`

const padCenters = (elements: any[], refdes: string) =>
  elements
    .filter(
      (element) =>
        element.type === "pcb_smtpad" &&
        element.pcb_smtpad_id.includes(`_${refdes}_`),
    )
    .map((pad) => ({
      x: Number(pad.x.toFixed(4)),
      y: Number(pad.y.toFixed(4)),
    }))

test("place rotation is applied to pad positions", () => {
  const dsnJson = parseDsnToDsnJson(rotatedPlacementDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson) as any[]

  // U1 is unrotated: pads stay on the x axis either side of the origin.
  expect(padCenters(circuitJson, "U1")).toEqual([
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ])

  // U2 is rotated 90 degrees counter-clockwise about its placement origin,
  // so the pads move onto the y axis relative to that origin.
  expect(padCenters(circuitJson, "U2")).toEqual([
    { x: 5, y: 4 },
    { x: 5, y: 6 },
  ])
})

test("rotated pads carry the placement rotation", () => {
  const dsnJson = parseDsnToDsnJson(rotatedPlacementDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson) as any[]

  const rotatedPad = circuitJson.find(
    (element) =>
      element.type === "pcb_smtpad" && element.pcb_smtpad_id.includes("_U2_"),
  )

  expect(rotatedPad.ccw_rotation).toBe(90)
})

test("smoothieboard pcb_ports resolve to real pcb_components", () => {
  const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson) as any[]

  const componentIds = new Set(
    circuitJson
      .filter((element) => element.type === "pcb_component")
      .map((element) => element.pcb_component_id),
  )
  const ports = circuitJson.filter((element) => element.type === "pcb_port")

  expect(ports.length).toBeGreaterThan(0)
  expect(componentIds.size).toBe(322)

  const dangling = ports.filter(
    (port) => !componentIds.has(port.pcb_component_id),
  )
  expect(dangling).toHaveLength(0)
})
