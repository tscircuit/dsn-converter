import type { DsnPcb } from "lib/dsn-pcb/types"

export const convertNetsToSourceNetsAndTraces = (dsnPcb: DsnPcb) => {
  const { nets } = dsnPcb.network

  for (const { name, pins } of nets) {
  }

  return []
}
