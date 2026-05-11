import { expect, test } from "bun:test"
import type { PcbSmtPad } from "circuit-json"
import { type DsnPcb, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"

const dsnWithOffCenterPadstackShape = `
(pcb off_center_padstack_shape
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "test")
    (host_version "1")
  )
  (resolution um 1)
  (unit um)
  (structure
    (layer F.Cu (type signal) (property (index 0)))
    (layer B.Cu (type signal) (property (index 1)))
    (boundary (path pcb 0 -5000 -5000 5000 -5000 5000 5000 -5000 5000 -5000 -5000))
    (via "Via[0-1]_600:300_um")
    (rule (width 100) (clearance 100))
  )
  (placement
    (component U
      (place U1 1000 2000 front 0)
    )
  )
  (library
    (image U
      (pin OffsetRect 1 0 0)
    )
    (padstack OffsetRect
      (shape (rect F.Cu 0 0 1000 500))
      (attach off)
    )
  )
  (network
    (net N1 (pins U1-1))
    (class default N1 (circuit (use_via "Via[0-1]_600:300_um")) (rule (width 100) (clearance 100)))
  )
  (wiring)
)
`

test("offsets SMT pad centers by the padstack shape center", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithOffCenterPadstackShape) as DsnPcb
  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)
  const pcbSmtpad = circuitJson.find(
    (element): element is PcbSmtPad => element.type === "pcb_smtpad",
  )

  expect(pcbSmtpad).toBeDefined()
  if (!pcbSmtpad || pcbSmtpad.shape !== "rect") {
    throw new Error("Expected a rectangular pcb_smtpad")
  }
  expect(pcbSmtpad.x).toBe(1.5)
  expect(pcbSmtpad.y).toBe(2.25)
  expect(pcbSmtpad.width).toBe(1)
  expect(pcbSmtpad.height).toBe(0.5)
})
