import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnJson } from "lib"

import circuitJson from "../assets/repro/repro14/usb-c-flashlight.json"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("usb-c plated hole shpaed `Pill` shpuld have unique pin numbers", async () => {
  const dsnJson = convertCircuitJsonToDsnJson(
    circuitJson as AnyCircuitElement[],
  ) as DsnPcb

  const image = dsnJson.library.images.find(
    (image) => image.name === "simple_chip:9.8502x6.7732_mm",
  )

  const platedHoleWithPinShaped = image?.pins.filter((pin) =>
    pin.padstack_name.includes("Oval[A]Pad"),
  )

  const pinNumbers = platedHoleWithPinShaped?.map((pin) => pin.pin_number)
  const uniquePinNumbers = new Set(pinNumbers)

  expect(uniquePinNumbers.size).toBe(platedHoleWithPinShaped?.length!)
})
