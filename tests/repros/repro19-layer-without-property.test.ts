import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}

/**
 * Part of https://github.com/tscircuit/dsn-converter/issues/54
 *
 * stringifyDsnJson unconditionally read `layer.property.index`, but some
 * real-world DSN exports (e.g. freerouting's own session-merged PCB output,
 * see tests/assets/testkicadproject/freeroutingTraceAdded.dsn) emit layers
 * with no `(property ...)` block at all. parseDsnToDsnJson already tolerated
 * this (leaving `layer.property` undefined), but stringifyDsnJson crashed
 * outright instead of just omitting the block it never had.
 */
test("stringifyDsnJson doesn't crash on a layer with no property/index", () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile) as DsnPcb
  // Use a real, otherwise-valid DsnPcb and strip just the one field under
  // test, so we're not hand-rolling a synthetic object that might be
  // invalid in unrelated ways.
  // The real DsnPcb type requires `property`, but parseDsnToDsnJson already
  // produces layers without it for some real-world files (see below), so the
  // type doesn't match actual runtime shapes here. Cast at the boundary
  // rather than loosening the shared type for this one test.
  const withoutLayerProperty = {
    ...dsnJson,
    structure: {
      ...dsnJson.structure,
      layers: dsnJson.structure.layers.map(({ property, ...rest }) => rest),
    },
  } as unknown as DsnPcb

  expect(() => stringifyDsnJson(withoutLayerProperty)).not.toThrow()

  const reparsed = parseDsnToDsnJson(
    stringifyDsnJson(withoutLayerProperty),
  ) as DsnPcb
  expect(reparsed.structure.layers.map((l: any) => l.property)).toEqual(
    withoutLayerProperty.structure.layers.map(() => undefined),
  )
})
