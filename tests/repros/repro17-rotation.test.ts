import { expect, test } from "bun:test"
import { parseDsnToDsnJson, convertDsnPcbToCircuitJson } from "lib"
// @ts-ignore
import dsn from "../assets/repro/smoothieboard-repro.dsn" with { type: "text" }

/**
 * Rotated components (e.g. JP36 placed with rotation 270) previously had pin
 * offsets applied without rotation, so pad centers were wrong whenever a
 * component was placed at a non-zero rotation.
 */
test("pad centers respect component placement rotation", () => {
  const dsnJson = parseDsnToDsnJson(dsn as any)
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson) as any[]

  // JP36: solder jumper, 2 pads at pin offsets (+0.65mm, 0) / (-0.65mm, 0),
  // placed at (123736, -89319.1) um with rotation 270.
  // Pin offsets rotated 270 CCW: (x, y) -> (0, -x)... so pads should be
  // vertically offset from the component center by +-0.65mm in DSN space.
  const pads = circuitJson.filter(
    (e) =>
      e.type === "pcb_smtpad" &&
      String(e.pcb_component_id).endsWith("_JP36"),
  )
  expect(pads).toHaveLength(2)

  const padCenters = pads.map((p) => {
    expect(p.shape).toBe("polygon")
    const xs = p.points.map((q: any) => q.x)
    const ys = p.points.map((q: any) => q.y)
    return {
      cx: (Math.min(...xs) + Math.max(...xs)) / 2,
      cy: (Math.min(...ys) + Math.max(...ys)) / 2,
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    }
  })

  // Component center in mm (unit um / 1000): (123.736, -89.3191)
  // Pads rotated 270deg: each 1.0x0.5mm pad becomes 0.5 wide x 1.0 tall
  for (const c of padCenters) {
    expect(c.w).toBeCloseTo(1.0, 2)
    expect(c.h).toBeCloseTo(1.5, 2)
    // Center x must equal the component x (offset was along x before rotation)
    expect(c.cx).toBeCloseTo(123.736, 2)
    // Pad centers must be offset vertically by +-0.65mm, not horizontally
    expect(Math.abs(c.cy - -89.3191)).toBeCloseTo(0.65, 2)
  }

  // The two pads must be on opposite sides of the component center
  const [a, b] = padCenters
  expect(Math.sign(a.cy - -89.3191)).not.toBe(
    Math.sign(b.cy - -89.3191),
  )
})
