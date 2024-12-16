import type { DsnPcb, DsnSession } from "../types"
import Debug from "debug"

const debug = Debug("dsn-converter:mergeDsnSessionIntoDsnPcb")

export function mergeDsnSessionIntoDsnPcb(
  dsnPcb: DsnPcb,
  dsnSession: DsnSession,
): DsnPcb {
  // Create a deep copy of the PCB to avoid mutating the original
  const mergedPcb: DsnPcb = JSON.parse(JSON.stringify(dsnPcb))

  // Update placement if session has different component positions
  if (dsnSession.placement?.components) {
    mergedPcb.placement.components = dsnSession.placement.components
  }

  // Add wires from session's network_out to PCB's wiring
  if (dsnSession.routes?.network_out?.nets) {
    // Clear existing wires since session represents final state
    mergedPcb.wiring.wires = []

    dsnSession.routes.network_out.nets.forEach((sessionNet) => {
      if (sessionNet.wires) {
        sessionNet.wires.forEach((wire) => {
          debug("WIRE\n----\n", wire)
          if (wire.path) {
            mergedPcb.wiring.wires.push({
              path: {
                ...wire.path,
                // DsnSession represents the coordinates in ses units, which are
                // 10x larger than the um units used in the DsnPcb files
                coordinates: wire.path.coordinates.map((c) => c / 10),
              },
              net: sessionNet.name,
              type: "route",
            })
          }
        })
      }
    })
  }

  // Add any padstacks from session's library_out to PCB's library
  if (dsnSession.routes?.library_out?.padstacks) {
    const existingPadstackNames = new Set(
      mergedPcb.library.padstacks.map((p) => p.name),
    )

    dsnSession.routes.library_out.padstacks.forEach((padstack) => {
      if (!existingPadstackNames.has(padstack.name)) {
        mergedPcb.library.padstacks.push(padstack)
      }
    })
  }

  return mergedPcb
}
