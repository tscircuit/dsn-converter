import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import dsnFileWithFreeroutingTrace from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("smoothieboard repro", async () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb

  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})

test("smoothieboard placement PNs keep numeric prefixes and suffixes", () => {
  const dsnJson = parseDsnToDsnJson(dsnFileWithFreeroutingTrace) as DsnPcb
  const placesByRefdes = new Map(
    dsnJson.placement.components.flatMap((component) =>
      component.places.map((place) => [place.refdes, place]),
    ),
  )

  expect(placesByRefdes.get("Q2")?.PN).toBe("12MHz")
  expect(placesByRefdes.get("C2")?.PN).toBe("12pF")
  expect(placesByRefdes.get("R31")?.PN).toBe("0.05R")
  expect(placesByRefdes.get("R92")?.PN).toBe("5k6")
  expect(placesByRefdes.get("U$5")?.PN).toBe("5MMCONN")
})
