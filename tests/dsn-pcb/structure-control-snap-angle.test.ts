import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("preserves structure snap angle and control settings", () => {
  const dsn = `(pcb "structure-control.dsn"
    (parser
      (host_version "freerouting-test")
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
        (path pcb 0 0 0 1000 0 1000 1000 0 1000)
      )
      (via "Via[0-1]_600:300_um")
      (rule
        (width 200)
        (clearance 200)
      )
      (snap_angle
        fortyfive_degree
      )
      (control
        (via_at_smd off)
      )
    )
    (placement)
    (library)
    (network)
    (wiring)
  )`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb

  expect(dsnJson.structure.snap_angle).toBe("fortyfive_degree")
  expect(dsnJson.structure.control?.via_at_smd).toBe("off")

  const dsnString = stringifyDsnJson(dsnJson)

  expect(dsnString).toContain("(snap_angle")
  expect(dsnString).toContain("fortyfive_degree")
  expect(dsnString).toContain("(control")
  expect(dsnString).toContain("(via_at_smd off)")
})
