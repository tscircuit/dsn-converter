import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

const dsnWithRotatedPlacement = `(pcb test.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "(5.1.9)-1")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer Top (type signal) (property (index 0)))
    (layer Bottom (type signal) (property (index 1)))
    (boundary (path pcb 0 0 0 10000 0 10000 10000 0 10000 0 0))
    (via "Via[0-1]_800:400_um")
    (rule (width 250) (clearance 200.1))
  )
  (placement
    (component "R0603"
      (place R1 1000 2000 front 90)
    )
  )
  (library
    (image "R0603"
      (pin Rect[T]Pad_1000x1100_um 1 1000 0)
      (pin Rect[T]Pad_1000x1100_um 2 -1000 0)
    )
    (padstack "Rect[T]Pad_1000x1100_um"
      (shape (rect Top -500 -550 500 550))
      (attach off)
    )
  )
  (network
    (net "Net-(R1-Pad1)" (pins R1-1))
    (net "Net-(R1-Pad2)" (pins R1-2))
    (class "kicad_default" "" "Net-(R1-Pad1)" "Net-(R1-Pad2)"
      (circuit (use_via "Via[0-1]_800:400_um"))
      (rule (width 250) (clearance 200.1))
    )
  )
  (wiring)
)`

const dsnWithRotatedPin = dsnWithRotatedPlacement.replace(
  "(pin Rect[T]Pad_1000x1100_um 1 1000 0)",
  '(pin Rect[T]Pad_1000x1100_um (rotate 90) "A" 1000 0)',
)

test("dsn import applies component placement rotation to pads and ports", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithRotatedPlacement) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const pads = circuitJson
    .filter((element) => element.type === "pcb_smtpad")
    .sort((a: any, b: any) => a.port_hints[0].localeCompare(b.port_hints[0]))
  const ports = circuitJson
    .filter((element) => element.type === "pcb_port")
    .sort((a: any, b: any) => a.source_port_id.localeCompare(b.source_port_id))

  expect(pads).toHaveLength(2)
  expect((pads[0] as any).x).toBeCloseTo(1)
  expect((pads[0] as any).y).toBeCloseTo(3)
  expect((pads[0] as any).width).toBe(1.1)
  expect((pads[0] as any).height).toBe(1)
  expect((pads[1] as any).x).toBeCloseTo(1)
  expect((pads[1] as any).y).toBeCloseTo(1)
  expect((pads[1] as any).width).toBe(1.1)
  expect((pads[1] as any).height).toBe(1)
  expect((ports[0] as any).x).toBeCloseTo(1)
  expect((ports[0] as any).y).toBeCloseTo(3)
  expect((ports[1] as any).x).toBeCloseTo(1)
  expect((ports[1] as any).y).toBeCloseTo(1)
})

test("dsn parser reads pin numbers after optional pin rotate nodes", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithRotatedPin) as DsnPcb
  const pin = dsnJson.library.images[0].pins[0]

  expect(pin.pin_number).toBe("A")
  expect(pin.rotation).toBe(90)
  expect(pin.x).toBe(1000)
  expect(pin.y).toBe(0)
})
