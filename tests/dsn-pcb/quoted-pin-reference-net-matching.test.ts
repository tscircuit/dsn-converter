import { expect, test } from "bun:test"
import type { SourcePort, SourceTrace } from "circuit-json"
import { parseDsnToCircuitJson } from "lib"

const dsnWithQuotedPinReferences = `
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
      (place X14 0 0 front 0)
    )
    (component "RJ45-CONN"
      (place RJ1 3000 0 front 0)
    )
  )
  (library
    (image "USB-CONN"
      (pin Rect[T]Pad_100x100_um "D-" 0 0)
      (pin Rect[T]Pad_100x100_um D+ 1000 0)
    )
    (image "RJ45-CONN"
      (pin Rect[T]Pad_100x100_um "RD-" 0 0)
      (pin Rect[T]Pad_100x100_um RD+ 1000 0)
    )
    (padstack Rect[T]Pad_100x100_um
      (shape (rect Top -50 -50 50 50))
      (attach off)
    )
  )
  (network
    (net "/USB_D-" (pins X14-"D-"))
    (net "/ETH_RD-" (pins RJ1-"RD-"))
    (net "/USB_D+" (pins X14-D+))
    (class default "" "/USB_D-" "/ETH_RD-" "/USB_D+" (circuit (use_via "")) (rule (width 100) (clearance 100)))
  )
  (wiring)
)
`

test("matches quoted DSN pin references to parsed source ports", () => {
  const circuitJson = parseDsnToCircuitJson(dsnWithQuotedPinReferences)

  const sourcePorts = circuitJson.filter(
    (element): element is SourcePort => element.type === "source_port",
  )
  const sourceTraces = circuitJson.filter(
    (element): element is SourceTrace => element.type === "source_trace",
  )

  const getPortId = (name: string) => {
    const sourcePort = sourcePorts.find((port) => port.name === name)
    expect(sourcePort).toBeDefined()
    return sourcePort!.source_port_id
  }

  const getTrace = (sourceNetId: string) => {
    const sourceTrace = sourceTraces.find((trace) =>
      trace.connected_source_net_ids.includes(sourceNetId),
    )
    expect(sourceTrace).toBeDefined()
    return sourceTrace!
  }

  expect(getTrace("source_net_/USB_D-").connected_source_port_ids).toEqual([
    getPortId("X14-D-"),
  ])
  expect(getTrace("source_net_/ETH_RD-").connected_source_port_ids).toEqual([
    getPortId("RJ1-RD-"),
  ])
  expect(getTrace("source_net_/USB_D+").connected_source_port_ids).toEqual([
    getPortId("X14-D+"),
  ])
})
