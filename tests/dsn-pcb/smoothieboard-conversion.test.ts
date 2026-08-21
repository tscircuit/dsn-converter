import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import { convertDsnPcbToCircuitJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-pcb-to-circuit-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

export function testSmoothieBoardConversion() {
  const sampleDsn = `
(pcb smoothieboard.dsn
  (structure
    (keepout "" (circle all 1000 500 500))
    (keepout "" (polygon F.Cu 0 0 1000 0 1000 1000 0 1000))
    (plane AGND (polygon B.Cu 0 0 2000 0 2000 2000 0 2000))
  )
)
`
  const dsnJson = parseDsnToDsnJson(sampleDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const keepouts = circuitJson.filter((e: any) => e.type === "pcb_keepout")
  const copperPours = circuitJson.filter(
    (e: any) => e.type === "pcb_copper_pour",
  )

  if (keepouts.length === 0 || copperPours.length === 0) {
    throw new Error("Smoothie Board keepout or copper pour conversion failed")
  }
}
