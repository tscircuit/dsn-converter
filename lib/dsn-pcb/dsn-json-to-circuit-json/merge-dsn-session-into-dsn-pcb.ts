import Debug from "debug"
import type { DsnPcb, DsnSession } from "../types"

const debug = Debug("dsn-converter:mergeDsnSessionIntoDsnPcb")

export function mergeDsnSessionIntoDsnPcb(
  dsnPcb: DsnPcb,
  dsnSession: DsnSession,
): DsnPcb {
  // Create a deep copy of the PCB to avoid mutating the original
  const mergedPcb: DsnPcb = JSON.parse(JSON.stringify(dsnPcb))

  // Update placement if session has different component positions
  if (dsnSession.placement?.components) {
    const existingPlacesByRefdes = new Map(
      dsnPcb.placement?.components?.flatMap((comp) =>
        comp.places.map((place) => [place.refdes, place] as const),
      ) ?? [],
    )
    const sessionPlacesByRefdes = new Map(
      dsnSession.placement.components.flatMap((comp) =>
        comp.places.map((place) => [place.refdes, place] as const),
      ),
    )
    const isAlreadyInPcbUnits =
      dsnSession.placement.components.length > 0 &&
      dsnSession.placement.components.every((comp) =>
        comp.places.every((place) => {
          const existing = existingPlacesByRefdes.get(place.refdes)
          return (
            existing !== undefined &&
            existing.x === place.x &&
            existing.y === place.y &&
            (place.x !== 0 || place.y !== 0 || Boolean(place.PN))
          )
        }),
      )
    const placementScale = isAlreadyInPcbUnits ? 1 : 10

    if (mergedPcb.placement.components.length > 0) {
      mergedPcb.placement.components = mergedPcb.placement.components.map(
        (comp) => ({
          ...comp,
          places: comp.places.map((existingPlace) => {
            const sessionPlace = sessionPlacesByRefdes.get(existingPlace.refdes)
            if (!sessionPlace) return existingPlace
            return {
              ...existingPlace,
              ...sessionPlace,
              x: sessionPlace.x / placementScale,
              y: sessionPlace.y / placementScale,
              PN: sessionPlace.PN || existingPlace.PN || "",
            }
          }),
        }),
      )
    } else {
      mergedPcb.placement.components = dsnSession.placement.components.map(
        (comp) => ({
          ...comp,
          places: comp.places.map((place) => ({
            ...place,
            x: place.x / placementScale,
            y: place.y / placementScale,
          })),
        }),
      )
    }
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
                // DsnSession represents dimensions and coordinates in ses units,
                // which are 10x larger than the um units used in DsnPcb files
                width: wire.path.width / 10,
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
        mergedPcb.library.padstacks.push({
          ...padstack,
          shapes: padstack.shapes.map((shape) => {
            if (shape.shapeType === "circle") {
              return { ...shape, diameter: shape.diameter / 10 }
            }
            if (shape.shapeType === "path") {
              return {
                ...shape,
                width: shape.width / 10,
                coordinates: shape.coordinates.map((c) => c / 10),
              }
            }
            return {
              ...shape,
              coordinates: shape.coordinates.map((c) => c / 10),
            }
          }),
        })
        existingPadstackNames.add(padstack.name)
      }
    })
  }

  return mergedPcb
}
