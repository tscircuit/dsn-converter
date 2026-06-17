import { expect, test } from "bun:test"
import { type DsnSession, parseDsnToDsnJson } from "lib"

test("parse session routes resolution and parser metadata", () => {
  const sessionFile = `
    (session routed-board
      (base_design routed-board)
      (placement
        (resolution um 10)
      )
      (was_is)
      (routes
        (resolution mil 5)
        (parser
          (host_cad "SPECCTRA")
          (host_version "1.2.3")
        )
        (network_out)
      )
    )
  `

  const sessionJson = parseDsnToDsnJson(sessionFile) as DsnSession

  expect(sessionJson.routes.resolution).toEqual({
    unit: "mil",
    value: 5,
  })
  expect(sessionJson.routes.parser.host_cad).toBe("SPECCTRA")
  expect(sessionJson.routes.parser.host_version).toBe("1.2.3")
})
