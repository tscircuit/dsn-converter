import { expect, test } from "bun:test"
import { type DsnSession, parseDsnToDsnJson, stringifyDsnSession } from "lib"

// @ts-ignore
import outputMotorSession from "../assets/repro/output_motor.ses" with {
  type: "text",
}

/**
 * Part of https://github.com/tscircuit/dsn-converter/issues/54
 *
 * stringifyDsnSession wrote each network_out net's wires but never wrote its
 * vias, so any via placed while routing (freerouting's session output)
 * silently disappeared on parse -> stringify -> reparse. This matters for
 * merging a freerouting session back into the original PCB DSN.
 */
test("session network_out net vias survive a parse -> stringify -> reparse round trip", () => {
  const session = parseDsnToDsnJson(outputMotorSession) as DsnSession

  const netsWithVias = session.routes.network_out.nets.filter(
    (net) => (net.vias?.length ?? 0) > 0,
  )
  // Sanity check the fixture actually exercises this case
  expect(netsWithVias.length).toBeGreaterThan(0)

  const reparsed = parseDsnToDsnJson(stringifyDsnSession(session)) as DsnSession

  for (const original of netsWithVias) {
    const roundtripped = reparsed.routes.network_out.nets.find(
      (net) => net.name === original.name,
    )
    expect(roundtripped).toBeDefined()
    expect(roundtripped!.vias).toEqual(original.vias)
  }
})
