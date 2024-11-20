import { scale, applyToPoint } from "transformation-matrix"
import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import type { DsnJson, DsnPcb, DsnSession } from "../types"
import { convertWiresToPcbTraces } from "./dsn-component-converters/convert-wire-to-trace"
import Debug from "debug"
import { convertDsnPcbToCircuitJson } from "./convert-dsn-pcb-to-circuit-json"
import { convertWiringPathToPcbTraces } from "./dsn-component-converters/convert-wiring-path-to-pcb-traces"

const debug = Debug("dsn-converter")

export function convertDsnSessionToCircuitJson(
  dsnInput: DsnPcb,
  dsnSession: DsnSession,
): AnyCircuitElement[] {
  const transformUmToMm = scale(1 / 10000)

  if (debug.enabled) {
    Bun.write("dsn-session.json", JSON.stringify(dsnSession, null, 2))
  }

  const inputPcbElms = convertDsnPcbToCircuitJson(dsnInput as DsnPcb)

  // Add the wires from the session
  const wireElements: AnyCircuitElement[] = []
  for (const net of dsnSession.routes.network_out.nets) {
    for (const wire of net.wires) {
      if ("path" in wire) {
        wireElements.push(
          ...convertWiringPathToPcbTraces({
            wire,
            transformUmToMm,
            netName: net.name,
          }),
        )
      }
    }
    // console.log(net)
    // wireElements.push(
    //   ...convertWiresToPcbTraces(net, dsnInput.network, transformUmToMm),
    // )
  }

  // console.log(wireElements)

  return [...inputPcbElms, ...wireElements]
}
