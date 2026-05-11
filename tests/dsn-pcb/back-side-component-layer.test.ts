import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbPort, PcbSmtPad } from "circuit-json"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

const dsnWithBackSideRectPad = `(pcb back-side-pad.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "")
  )
  (resolution um 1)
  (unit um)
  (structure
    (layer F.Cu (type signal) (property (index 0)))
    (layer B.Cu (type signal) (property (index 1)))
    (boundary (path pcb 0 -5000 -5000 5000 -5000 5000 5000 -5000 5000 -5000 -5000))
    (via "Via[0-1]_600:300_um")
    (rule (width 200) (clearance 150))
  )
  (placement
    (component "test:SJ_3"
      (place SJ1 1000 0 back 0 (PN SOLDERJUMPER_2WAYS))
    )
  )
  (library
    (image "test:SJ_3"
      (pin Rect[T]Pad_635x1270_um 1 -889 0)
      (pin Rect[T]Pad_635x1270_um 2 0 0)
      (pin Rect[T]Pad_635x1270_um 3 889 0)
    )
    (padstack Rect[T]Pad_635x1270_um
      (shape (rect Top -317.5 -635 317.5 635))
      (attach off)
    )
  )
  (network
    (net GND (pins SJ1-1))
    (class "kicad_default" "" GND (circuit (use_via "Via[0-1]_600:300_um")) (rule (clearance 150) (width 150)))
  )
  (wiring)
)`

const isPcbSmtPad = (element: AnyCircuitElement): element is PcbSmtPad =>
  element.type === "pcb_smtpad"

const isPcbPort = (element: AnyCircuitElement): element is PcbPort =>
  element.type === "pcb_port"

test("rectangular pads for back-side DSN components are emitted on the bottom layer", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithBackSideRectPad) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const pads = circuitJson
    .filter(isPcbSmtPad)
    .filter((element) => element.pcb_component_id === "test:SJ_3_SJ1")
  const ports = circuitJson
    .filter(isPcbPort)
    .filter((element) => element.source_port_id.endsWith("_SJ1"))

  expect(pads).toHaveLength(3)
  expect(pads.every((pad) => pad.layer === "bottom")).toBe(true)
  expect(ports).toHaveLength(3)
  expect(ports.every((port) => port.layers.includes("bottom"))).toBe(true)
})

test("Smoothie Board back-side solder jumpers are emitted on the bottom layer", async () => {
  const smoothieboardDsn = await Bun.file(
    new URL("../assets/repro/smoothieboard-repro.dsn", import.meta.url),
  ).text()
  const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const solderJumperPads = circuitJson
    .filter(isPcbSmtPad)
    .filter((element) =>
      [
        "smoothieboard-5driver:SJ_3_SJ1",
        "smoothieboard-5driver:SJ_3_SJ2",
        "smoothieboard-5driver:SJ_3_SJ3",
      ].includes(element.pcb_component_id ?? ""),
    )

  expect(solderJumperPads).toHaveLength(9)
  expect(solderJumperPads.every((pad) => pad.layer === "bottom")).toBe(true)
})
