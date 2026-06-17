import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("parser captures image-level circle keepouts", () => {
  const parsed = parseDsnToDsnJson(smoothieDsn) as DsnPcb

  const withKeepouts = parsed.library.images.filter(
    (img) => (img.keepouts?.length ?? 0) > 0,
  )
  expect(withKeepouts.length).toBeGreaterThan(0)

  const k = withKeepouts[0].keepouts![0]
  expect(k.shape).toBe("circle")
  expect(typeof k.layer).toBe("string")
  expect(k.layer.length).toBeGreaterThan(0)
  expect(k.diameter).toBeGreaterThan(0)

  const totalKeepouts = parsed.library.images.reduce(
    (n, img) => n + (img.keepouts?.length ?? 0),
    0,
  )
  expect(totalKeepouts).toBe(44)

  const hasNonZeroCoords = parsed.library.images.some((img) =>
    img.keepouts?.some((k) => k.x !== 0 || k.y !== 0),
  )
  expect(hasNonZeroCoords).toBe(true)
})
