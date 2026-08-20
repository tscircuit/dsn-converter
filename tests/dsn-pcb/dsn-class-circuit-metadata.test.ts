import { expect, test } from "bun:test"
import { stringifyDsnJson } from "../../lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "../../lib/dsn-pcb/types"

const dsnWithClassCircuitMetadata = `(pcb "./class-circuit-metadata.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad")
    (host_version "1")
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
      (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 150)
      (clearance 200)
    )
  )
  (placement)
  (library)
  (network
    (net "N1"
      (pins U1-1 U2-1)
    )
    (class "default" "desc" "N1"
      (circuit
        (clearance_class default)
        (use_via "Via[0-1]_600:300_um")
        (via_rule default)
      )
      (rule
        (width 150)
        (clearance 200)
      )
    )
  )
  (wiring)
)`

test("preserves class circuit clearance_class and via_rule metadata", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithClassCircuitMetadata) as DsnPcb
  const circuit = dsnJson.network.classes[0].circuit

  expect(circuit.clearance_class).toBe("default")
  expect(circuit.use_via).toBe("Via[0-1]_600:300_um")
  expect(circuit.via_rule).toBe("default")

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsed = parseDsnToDsnJson(dsnString) as DsnPcb
  const reparsedCircuit = reparsed.network.classes[0].circuit

  expect(dsnString).toContain('(clearance_class "default")')
  expect(dsnString).toContain('(via_rule "default")')
  expect(reparsedCircuit.clearance_class).toBe("default")
  expect(reparsedCircuit.use_via).toBe("Via[0-1]_600:300_um")
  expect(reparsedCircuit.via_rule).toBe("default")
})

const dsnWithWireClearanceClass = `(pcb "./wire-clearance-class.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad")
    (host_version "1")
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
    (boundary
      (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 150)
      (clearance 200)
    )
  )
  (placement)
  (library)
  (network
    (net "N1"
      (pins U1-1 U2-1)
    )
    (class "default" "desc" "N1"
      (circuit
        (use_via "Via[0-1]_600:300_um")
      )
      (rule
        (width 150)
        (clearance 200)
      )
    )
  )
  (wiring
    (wire
      (path F.Cu 100 0 0 1000 0)
      (net "N1")
      (clearance_class tight)
      (type route)
    )
  )
)`

test("preserves wire clearance_class metadata", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithWireClearanceClass) as DsnPcb
  const wire = dsnJson.wiring.wires[0]

  expect(wire.clearance_class).toBe("tight")

  const dsnString = stringifyDsnJson(dsnJson)
  const reparsed = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(dsnString).toContain('(clearance_class "tight")')
  expect(reparsed.wiring.wires[0].clearance_class).toBe("tight")
})
