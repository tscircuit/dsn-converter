import { expect, test } from "bun:test"
import { parseDsnToDsnJson } from "lib"

test("parses session routes resolution, parser metadata, and polyline_path wires", () => {
  const sessionDsn = `(session "routed.ses"
  (base_design "board.dsn")
  (placement
    (resolution um 10)
    (component "R_0402"
      (place R1 1000 -2000 front 0)
    )
  )
  (routes
    (resolution um 100)
    (parser
      (host_cad "Freerouting")
      (host_version "1.9.0")
    )
    (library_out
      (padstack "Via[0-1]_600:300_um"
        (shape (circle F.Cu 600))
        (shape (circle B.Cu 600))
        (attach off)
      )
    )
    (network_out
      (net "Net-(R1-Pad1)"
        (wire
          (polyline_path F.Cu 2500 1000 -2000 3000 -2000 3000 500)
          (clearance_class default)
        )
        (wire
          (path B.Cu 1500 3000 500 5000 500)
        )
      )
    )
  )
)`

  const parsed = parseDsnToDsnJson(sessionDsn)
  if (!parsed.is_dsn_session) {
    throw new Error("Expected parsed DSN session")
  }

  expect(parsed.routes.resolution).toEqual({
    unit: "um",
    value: 100,
  })
  expect(parsed.routes.parser.host_cad).toBe("Freerouting")
  expect(parsed.routes.parser.host_version).toBe("1.9.0")

  const net = parsed.routes.network_out.nets[0]
  expect(net.name).toBe("Net-(R1-Pad1)")
  expect(net.wires).toHaveLength(2)
  expect(net.wires[0]).toEqual({
    polyline_path: {
      layer: "F.Cu",
      width: 2500,
      coordinates: [1000, -2000, 3000, -2000, 3000, 500],
    },
    net: "Net-(R1-Pad1)",
    type: "route",
    clearance_class: "default",
  })
  expect(net.wires[1]).toEqual({
    path: {
      layer: "B.Cu",
      width: 1500,
      coordinates: [3000, 500, 5000, 500],
    },
    net: "Net-(R1-Pad1)",
    type: "route",
  })
})
