import { expect, test } from "bun:test"
import {
  convertDsnPcbToCircuitJson,
  parseDsnToDsnJson,
  stringifyDsnJson,
} from "lib"
import type { DsnPcb } from "lib"

const dsnWithJavaErrorToken = `(pcb "smoothieboard_erro.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "8.0.3")
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
    (layer Route15
      (type java_error_token)
    )
    (layer B.Cu
      (type signal)
      (property
        (index 1)
      )
    )
    (boundary
      (path pcb 0 -5000 -5000 5000 -5000 5000 5000 -5000 5000 -5000 -5000)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 200)
      (clearance 150)
      (clearance 50 (type java_error_token))
    )
  )
  (placement
    (component "R_0603"
      (place R1 -1000 0 front 0 (PN "10k"))
    )
  )
  (library
    (image "R_0603"
      (pin RoundRect[T]Pad_800x900_um 1 -800 0)
      (pin RoundRect[T]Pad_800x900_um 2 800 0)
    )
    (padstack "RoundRect[T]Pad_800x900_um"
      (shape (polygon F.Cu 0 -400 450 400 450 400 -450 -400 -450 -400 450))
      (attach off)
    )
    (padstack "Via[0-1]_600:300_um"
      (shape (circle F.Cu 600))
      (shape (circle B.Cu 600))
      (attach off)
    )
  )
  (network
    (net "N1"
      (pins R1-1 R1-2)
    )
    (class "kicad_default" "" "N1"
      (circuit
        (use_via "Via[0-1]_600:300_um")
      )
      (rule
        (width 200)
        (clearance 150)
      )
    )
  )
  (wiring
    (wire (path F.Cu 200 -1800 0 -200 0)(net "N1")(type java_error_token))
  )
)`

test("parseDsnToDsnJson and convertDsnPcbToCircuitJson gracefully handle java_error_token in layer, clearance, and wire", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithJavaErrorToken) as DsnPcb

  const route15Layer = dsnJson.structure.layers.find(
    (l) => l.name === "Route15",
  )
  expect(route15Layer).toBeDefined()
  expect(route15Layer?.type).toBe("signal")
  expect(route15Layer?.property).toEqual({ index: 1 })

  expect(dsnJson.structure.rule.clearances[1]?.type).toBeUndefined()
  expect(dsnJson.wiring.wires[0]?.type).toBe("route")

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).not.toContain("java_error_token")

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)
  const traces = circuitJson.filter((el) => el.type === "pcb_trace")
  expect(traces).toHaveLength(1)
})
