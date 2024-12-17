import type { DsnPcb, DsnSession, Wire } from "lib/dsn-pcb/types"

export interface DsnTraceOperationsWrapper {
  getNextNetId(): string
  addWire(wire: Wire): void
  getLibrary(): DsnPcb["library"]
  getStructure(): DsnPcb["structure"] | null
}

/**
 * This operations wrapper allows you to operate on either DSN PCB or DSN
 * Session objects, increasing code reusability when working with traces.
 *
 * Please add more methods to this as you need them!
 */
export const getDsnTraceOperationsWrapper = (
  dsnObj: DsnPcb | DsnSession,
): DsnTraceOperationsWrapper => {
  if (dsnObj.is_dsn_pcb) {
    return {
      getNextNetId: () => `Net-${dsnObj.network.nets.length + 1}`,
      addWire: (wire: Wire) => {
        dsnObj.wiring.wires.push(wire as any)
      },
      getStructure: () => dsnObj.structure,
      getLibrary: () => dsnObj.library,
    }
  }

  if (dsnObj.is_dsn_session) {
    return {
      getNextNetId: () => `Net-${dsnObj.routes.network_out.nets.length + 1}`,
      getLibrary: () => dsnObj.routes.library_out!,
      getStructure: () => null,
      addWire: (wire: Wire) => {
        let net = dsnObj.routes.network_out.nets.find(
          (net) => net.name === wire.net,
        )
        if (!net) {
          net = {
            name: wire.net!,
            wires: [],
          }
          dsnObj.routes.network_out.nets.push(net)
        }
        net.wires.push(wire)
      },
    }
  }

  throw new Error("Invalid DSN object")
}
