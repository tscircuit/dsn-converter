import { expect, test } from "bun:test"
import {
  type DsnPcb,
  type DsnSession,
  mergeDsnSessionIntoDsnPcb,
  parseDsnToDsnJson,
  stringifyDsnSession,
} from "lib"
// @ts-ignore
import pcbFile from "../assets/freerouting-sessions/circuit1.dsn" with {
  type: "text",
}
// @ts-ignore
import sessionFile from "../assets/freerouting-sessions/session1.ses" with {
  type: "text",
}

test("stringify session file", () => {
  const sessionJson = parseDsnToDsnJson(sessionFile) as DsnSession
  const stringified = stringifyDsnSession(sessionJson)
  const reparsed = parseDsnToDsnJson(stringified) as DsnSession

  // Test that we can parse the generated string back to the same structure
  expect(reparsed.filename).toBe(sessionJson.filename)
  expect(reparsed.placement.components).toHaveLength(
    sessionJson.placement.components.length,
  )
  expect(reparsed.routes.network_out.nets).toHaveLength(
    sessionJson.routes.network_out.nets.length,
  )

  // Test specific values
  const originalNet = sessionJson.routes.network_out.nets[0]
  const reparsedNet = reparsed.routes.network_out.nets[0]
  expect(reparsedNet.name).toBe(originalNet.name)
  expect(reparsedNet.wires).toHaveLength(originalNet.wires.length)
  expect(reparsedNet.vias).toEqual(originalNet.vias)
})

test("stringifyDsnSession and mergeDsnSessionIntoDsnPcb preserve session vias", () => {
  const dsnPcb = parseDsnToDsnJson(pcbFile) as DsnPcb
  const sessionJson = parseDsnToDsnJson(sessionFile) as DsnSession
  sessionJson.routes.network_out.nets[0].vias = [{ x: 12000, y: -34000 }]

  const stringified = stringifyDsnSession(sessionJson)
  const reparsed = parseDsnToDsnJson(stringified) as DsnSession
  expect(reparsed.routes.network_out.nets[0].vias).toEqual([
    { x: 12000, y: -34000 },
  ])

  const mergedPcb = mergeDsnSessionIntoDsnPcb(dsnPcb, reparsed)
  const viaWires = mergedPcb.wiring.wires.filter((w) => w.type === "via")
  expect(viaWires).toHaveLength(1)
  expect(viaWires[0]?.path?.coordinates).toEqual([1200, -3400])
})
