import Debug from "debug"
import type { ComponentPlacement, DsnPcb, DsnSession } from "../types"

const debug = Debug("dsn-converter:mergeDsnSessionIntoDsnPcb")

const coordinatesMatch = (a: number, b: number) => Math.abs(a - b) < 1e-6

const shouldScaleSessionPlacement = (
  dsnPcb: DsnPcb,
  dsnSession: DsnSession,
) => {
  const existingPlaces = new Map<string, { x: number; y: number }>()

  dsnPcb.placement.components.forEach((component) => {
    component.places.forEach((place) => {
      existingPlaces.set(`${component.name}:${place.refdes}`, {
        x: place.x,
        y: place.y,
      })
    })
  })

  let scaledMatches = 0
  let unscaledMatches = 0

  dsnSession.placement.components.forEach((component) => {
    component.places.forEach((place) => {
      const existingPlace = existingPlaces.get(
        `${component.name}:${place.refdes}`,
      )
      if (!existingPlace) return

      for (const axis of ["x", "y"] as const) {
        if (coordinatesMatch(place[axis], existingPlace[axis])) {
          unscaledMatches++
        }
        if (coordinatesMatch(place[axis] / 10, existingPlace[axis])) {
          scaledMatches++
        }
      }
    })
  })

  return scaledMatches > unscaledMatches
}

const scalePlacementComponents = (
  components: ComponentPlacement[],
  coordinateDivisor: number,
): ComponentPlacement[] =>
  components.map((component) => ({
    ...component,
    places: component.places.map((place) => ({
      ...place,
      x: place.x / coordinateDivisor,
      y: place.y / coordinateDivisor,
    })),
  }))

export function mergeDsnSessionIntoDsnPcb(
  dsnPcb: DsnPcb,
  dsnSession: DsnSession,
): DsnPcb {
  // Create a deep copy of the PCB to avoid mutating the original
  const mergedPcb: DsnPcb = JSON.parse(JSON.stringify(dsnPcb))

  // Update placement if session has different component positions
  if (dsnSession.placement?.components) {
    const coordinateDivisor = shouldScaleSessionPlacement(dsnPcb, dsnSession)
      ? 10
      : 1

    mergedPcb.placement.components = scalePlacementComponents(
      dsnSession.placement.components,
      coordinateDivisor,
    )
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
              type: wire.type ?? "route",
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
