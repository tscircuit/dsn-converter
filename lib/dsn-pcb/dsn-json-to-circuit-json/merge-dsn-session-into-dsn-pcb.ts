import Debug from "debug"
import type { DsnPcb, DsnSession, Padstack, Shape } from "../types"

const debug = Debug("dsn-converter:mergeDsnSessionIntoDsnPcb")
const DEFAULT_SESSION_TO_PCB_SCALE = 10

function getSessionToPcbScale(resolution?: { value: number }): number {
  if (resolution?.value && Number.isFinite(resolution.value)) {
    return resolution.value
  }

  return DEFAULT_SESSION_TO_PCB_SCALE
}

function scaleCoordinates(coordinates: number[], scale: number): number[] {
  return coordinates.map((coordinate) => coordinate / scale)
}

function getNormalizedSessionShape(shape: Shape, scale: number): Shape {
  switch (shape.shapeType) {
    case "circle":
      return {
        ...shape,
        diameter: shape.diameter / scale,
      }
    case "rect":
      return {
        ...shape,
        coordinates: scaleCoordinates(shape.coordinates, scale),
      }
    case "path":
      return {
        ...shape,
        width: shape.width / scale,
        coordinates: scaleCoordinates(shape.coordinates, scale),
      }
    case "polygon":
      return {
        ...shape,
        width: shape.width / scale,
        coordinates: scaleCoordinates(shape.coordinates, scale),
      }
  }
}

function getNormalizedSessionPadstack(
  padstack: Padstack,
  scale: number,
): Padstack {
  return {
    ...padstack,
    shapes: padstack.shapes.map((shape) =>
      getNormalizedSessionShape(shape, scale),
    ),
    hole: padstack.hole
      ? {
          ...padstack.hole,
          width:
            padstack.hole.width === undefined
              ? undefined
              : padstack.hole.width / scale,
          height:
            padstack.hole.height === undefined
              ? undefined
              : padstack.hole.height / scale,
          diameter:
            padstack.hole.diameter === undefined
              ? undefined
              : padstack.hole.diameter / scale,
        }
      : undefined,
  }
}

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
              type: wire.type ?? "route",
            })
          }
        })
      }
    })
  }

  // Add any padstacks from session's library_out to PCB's library
  if (dsnSession.routes?.library_out?.padstacks) {
    const sessionToPcbScale = getSessionToPcbScale(dsnSession.routes.resolution)
    const existingPadstackNames = new Set(
      mergedPcb.library.padstacks.map((p) => p.name),
    )

    dsnSession.routes.library_out.padstacks.forEach((padstack) => {
      if (!existingPadstackNames.has(padstack.name)) {
        mergedPcb.library.padstacks.push(
          getNormalizedSessionPadstack(padstack, sessionToPcbScale),
        )
      }
    })
  }

  return mergedPcb
}
