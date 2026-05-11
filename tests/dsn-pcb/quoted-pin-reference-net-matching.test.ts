import { expect, test } from "bun:test"
import type { SourcePort, SourceTrace } from "circuit-json"
import { parseDsnToCircuitJson } from "lib"

const dsnWithQuotedPinReference = `
(pcb quoted_pin_reference
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu (type signal) (property (index 0)))
    (boundary (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0))
    (via "")
    (rule (width 100) (clearance 100))
  )
  (placement
    (component "USB-CONN"
      (place J1 0 0 front 0)
    )
  )
  (library
    (image "USB-CONN"
      (pin Rect[T]Pad_100x100_um "D-" 0 0)
      (pin Rect[T]Pad_100x100_um D+ 1000 0)
    )
    (padstack Rect[T]Pad_100x100_um
      (shape (rect Top -50 -50 50 50))
      (attach off)
    )
  )
  (network
    (net "/USB_D-" (pins J1-"D-"))
    (net "/USB_D+" (pins J1-D+))
    (class default "" "/USB_D-" "/USB_D+" (circuit (use_via "")) (rule (width 100) (clearance 100)))
  )
  (wiring)
)
`

test("matches quoted DSN pin references to parsed source ports", () => {
  const circuitJson = parseDsnToCircuitJson(dsnWithQuotedPinReference)

  const sourcePorts = circuitJson.filter(
    (element): element is SourcePort => element.type === "source_port",
  )
  const sourceTraces = circuitJson.filter(
    (element): element is SourceTrace => element.type === "source_trace",
  )

  const quotedPinPort = sourcePorts.find((port) => port.name === "J1-D-")
  const quotedPinTrace = sourceTraces.find((trace) =>
    trace.connected_source_net_ids.includes("source_net_/USB_D-"),
  )

  expect(quotedPinPort).toBeDefined()
  expect(quotedPinTrace).toBeDefined()
  expect(quotedPinTrace?.connected_source_port_ids).toEqual([
    quotedPinPort!.source_port_id,
  ])
})
