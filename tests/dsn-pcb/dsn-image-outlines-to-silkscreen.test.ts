import { expect, test } from "bun:test"
import type { PcbSilkscreenPath } from "circuit-json"
import { convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"
import type { DsnPcb } from "lib/dsn-pcb/types"
// @ts-ignore
import smoothieboardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("converts placed DSN image outlines to silkscreen paths", () => {
  const dsnPcb = parseDsnToDsnJson(`
    (pcb test.dsn
      (resolution um 1)
      (unit um)
      (structure
        (layer F.Cu (type signal) (property (index 0)))
        (layer B.Cu (type signal) (property (index 1)))
        (boundary (path pcb 0 0 0 10000 0 10000 10000 0 10000 0 0))
        (via "Via[0-1]_600:300_um")
        (rule (width 200) (clearance 150))
      )
      (placement
        (component U_LIB
          (place U1 10000 20000 front 90)
          (place U2 -10000 -20000 back 0)
        )
      )
      (library
        (image U_LIB
          (outline (path signal 100 0 0 1000 0 1000 500))
          (outline (path Bottom 200 0 0 0 1000))
        )
      )
      (network
        (class "kicad_default" "" (circuit (use_via "Via[0-1]_600:300_um")) (rule (width 150) (clearance 150)))
      )
      (wiring)
    )
  `) as DsnPcb

  const circuitJson = convertDsnPcbToCircuitJson(dsnPcb)
  const silkscreenPaths = circuitJson.filter(
    (element): element is PcbSilkscreenPath =>
      element.type === "pcb_silkscreen_path",
  )

  expect(silkscreenPaths).toHaveLength(4)
  expect(silkscreenPaths[0]).toMatchObject({
    pcb_component_id: "U_LIB_U1",
    layer: "top",
    stroke_width: 0.1,
    route: [
      { x: 10, y: 20 },
      { x: 10, y: 21 },
      { x: 9.5, y: 21 },
    ],
  })
  expect(silkscreenPaths[1]).toMatchObject({
    pcb_component_id: "U_LIB_U1",
    layer: "bottom",
    stroke_width: 0.2,
  })
  expect(silkscreenPaths[2]).toMatchObject({
    pcb_component_id: "U_LIB_U2",
    layer: "bottom",
    route: [
      { x: -10, y: -20 },
      { x: -11, y: -20 },
      { x: -11, y: -19.5 },
    ],
  })
})

test("emits Smoothie Board footprint outlines as silkscreen paths", () => {
  const dsnPcb = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnPcb)
  const silkscreenPaths = circuitJson.filter(
    (element) => element.type === "pcb_silkscreen_path",
  )

  expect(silkscreenPaths.length).toBeGreaterThan(700)
  expect(
    silkscreenPaths.some(
      (path) =>
        path.pcb_component_id ===
        "Jumper:SolderJumper-2_P1.3mm_Open_RoundedPad1.0x1.5mm_JP36",
    ),
  ).toBe(true)
})
