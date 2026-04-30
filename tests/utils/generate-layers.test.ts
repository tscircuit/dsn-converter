import { test, expect } from "bun:test"
import {
  generateLayerNames,
  getViaPadstackName,
} from "lib/utils/generate-layers"

test("generateLayerNames creates 2 layers", () => {
  expect(generateLayerNames(2)).toEqual(["F.Cu", "B.Cu"])
})

test("generateLayerNames creates 4 layers", () => {
  // 4 layers means 2 inner copper layers
  expect(generateLayerNames(4)).toEqual(["F.Cu", "In1.Cu", "In2.Cu", "B.Cu"])
})

test("generateLayerNames creates 6 layers", () => {
  expect(generateLayerNames(6)).toEqual([
    "F.Cu",
    "In1.Cu",
    "In2.Cu",
    "In3.Cu",
    "In4.Cu",
    "B.Cu",
  ])
})

test("getViaPadstackName formats correctly", () => {
  const name = getViaPadstackName(4, 600)
  expect(name).toContain("Via")
  expect(name).toContain("0-3")
})
