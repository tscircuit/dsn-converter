import type { AnyCircuitElement } from "circuit-json"
import type { ComponentPlacement, DsnPcb, DsnSession } from "../types"
import { processPcbTraces } from "./process-pcb-traces"

const SESSION_COORDINATE_SCALE = 10

function scalePlacementForSession(
  components: ComponentPlacement[],
): ComponentPlacement[] {
  return components.map((component) => ({
    ...component,
    places: component.places.map((place) => ({
      ...place,
      x: place.x * SESSION_COORDINATE_SCALE,
      y: place.y * SESSION_COORDINATE_SCALE,
    })),
  }))
}

export function convertCircuitJsonToDsnSession(
  dsnPcb: DsnPcb,
  circuitJson: AnyCircuitElement[],
): DsnSession {
  const session: DsnSession = {
    is_dsn_session: true,
    filename: dsnPcb.filename || "session",
    placement: {
      resolution: dsnPcb.resolution,
      components: scalePlacementForSession(dsnPcb.placement.components),
    },
    routes: {
      resolution: dsnPcb.resolution,
      parser: dsnPcb.parser,
      library_out: {
        images: [],
        padstacks: [],
      },
      network_out: {
        nets: [],
      },
    },
  }

  processPcbTraces(circuitJson, session, dsnPcb.structure.layers.length)

  return session
}
