import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

test("imports B.Cu padstack pins with matching bottom PCB port layers", () => {
  const dsn = `(pcb "bottom-pad-port.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "8.0")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
      (property
        (index 0)
      )
    )
    (layer B.Cu
      (type signal)
      (property
        (index 1)
      )
    )
    (boundary
      (path pcb 0 -1000 -1000 1000 -1000 1000 1000 -1000 1000 -1000 -1000)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement
    (component "BottomPadComp"
      (place U1 0 0 front 0 (PN "TEST"))
    )
  )
  (library
    (image "BottomPadComp"
      (pin "BottomRect" 1 0 0)
    )
    (padstack "BottomRect"
      (shape (rect B.Cu -100 -50 100 50))
      (attach off)
    )
  )
  (network
    (net "Net-(U1-Pad1)"
      (pins U1-1)
    )
    (class "kicad_default" "" "Net-(U1-Pad1)"
      (circuit
        (use_via "Via[0-1]_600:300_um")
      )
      (rule
        (width 100)
        (clearance 100)
      )
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const pcbSmtpad = circuitJson.find((element) => element.type === "pcb_smtpad")
  const pcbPort = circuitJson.find((element) => element.type === "pcb_port")

  expect(pcbSmtpad?.layer).toBe("bottom")
  expect(pcbPort?.layers).toEqual(["bottom"])
})
