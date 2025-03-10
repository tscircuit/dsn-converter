import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb, DsnSession } from "../types"
import { processPcbTraces } from "./process-pcb-traces"

export function convertCircuitJsonToDsnSession(
  dsnPcb: DsnPcb,
  circuitJson: AnyCircuitElement[],
): DsnSession {
  const session: DsnSession = {
    is_dsn_session: true,
    filename: dsnPcb.filename || "session",
    placement: {
      resolution: dsnPcb.resolution,
      components: dsnPcb.placement.components,
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

  processPcbTraces(circuitJson, session)

  return session
}
