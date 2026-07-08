import { expect, test } from "bun:test"
import { parsePadstackName } from "lib/utils/get-padstack-name"

test("parse generated circular plated-hole padstack names", () => {
  expect(parsePadstackName("Round[A]Pad_700_1000_um")).toEqual({
    shape: "circle",
    layer: "all",
    holeDiameter: 0.7,
    outerDiameter: 1,
  })
})

test("parse generated oval plated-hole padstack names", () => {
  const parsed = parsePadstackName("Oval[A]Pad_799.9983999999998x1399.9972_um")

  expect(parsed?.shape).toBe("oval")
  expect(parsed?.layer).toBe("all")
  if (parsed?.shape !== "oval") throw new Error("Expected oval padstack name")
  expect(parsed.width).toBeCloseTo(0.7999983999999998, 12)
  expect(parsed.height).toBeCloseTo(1.3999972, 12)
})

test("parse generated rectangular and polygon padstack names", () => {
  expect(parsePadstackName("RoundRect[T]Pad_3000x1500_um")).toEqual({
    shape: "rect",
    layer: "top",
    width: 3,
    height: 1.5,
  })

  expect(parsePadstackName("Cust[B]Pad_poly_10x20_um")).toEqual({
    shape: "polygon",
    layer: "bottom",
    descriptor: "poly_10x20",
  })
})

test("return null for names outside the generated padstack format", () => {
  expect(parsePadstackName("OvalPad_800x1400_um")).toBeNull()
  expect(parsePadstackName("Oval[A]Pad_800_um")).toBeNull()
  expect(parsePadstackName("Round[A]Pad_700x1000_um")).toBeNull()
})
