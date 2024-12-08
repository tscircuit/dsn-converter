import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"

import circuitJson from "../assets/repro/arduino-nano.json"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"

test("circuit json (arduino nano) -> dsn file", async () => {
  // Getting the dsn file from the circuit json
  const dsnFile = convertCircuitJsonToDsnString(
    circuitJson as AnyCircuitElement[],
  )

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb

  // expect the json placemet to have length 3
  expect(dsnJson.placement.components.length).toBe(7)
  expect(dsnJson.library.images.length).toBe(7)

  // image of usbc
  const usbcImage = dsnJson.library.images[0]
  expect(usbcImage.name).toBe("simple_chip:9.8502x6.7732_mm")
  // pin number in the range of 1 to 20
  usbcImage.pins.forEach((pin) => {
    expect(pin.pin_number).toBeGreaterThanOrEqual(1)
    expect(pin.pin_number).toBeLessThanOrEqual(20)
  })
  expect(usbcImage.pins).toHaveLength(20)
  expect(usbcImage.pins[0].padstack_name).toBe(
    "RoundRect[T]Pad_299.9994x1299.9974_um",
  )
  expect(usbcImage.pins[0].x).toBe(-1750.060000000076)
  expect(usbcImage.pins[0].y).toBe(2736.586449999919)
  expect(usbcImage.pins[19].padstack_name).toBe(
    "Oval[A]Pad_799.9983999999998x1399.9972_um",
  )
  expect(usbcImage.pins[19].x).toBe(-4325)
  expect(usbcImage.pins[19].y).toBe(-2486.500599999971)

  // padstack length
  expect(dsnJson.library.padstacks.length).toBe(10)
  // net length
  expect(dsnJson.network.nets.length).toBe(63)
})
