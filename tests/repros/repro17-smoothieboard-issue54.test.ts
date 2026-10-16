import { expect, test } from "bun:test"
import { tokenizeDsn } from "lib/common/parse-sexpr"
import type { DsnPcb } from "lib"
import { parseDsnToCircuitJson, parseDsnToDsnJson } from "lib"
import { getPinNum } from "lib/utils/get-pin-number"

// @ts-ignore
import smoothieboardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
const circuitJson = parseDsnToCircuitJson(smoothieboardDsn) as any[]

const byType = (type: string) => circuitJson.filter((el) => el.type === type)

test("smoothieboard: no NaN leaks into the converted output", () => {
  expect(JSON.stringify(circuitJson)).not.toContain("NaN")
  for (const port of byType("source_port")) {
    expect(
      port.pin_number === undefined || Number.isFinite(port.pin_number),
    ).toBe(true)
  }
})

test("smoothieboard: every element id is unique", () => {
  // Only each element's own primary id ("<type>_id"); reference fields like
  // pcb_component_id legitimately repeat across an element's children
  const ids: string[] = []
  for (const el of circuitJson) {
    const ownId = el[`${el.type}_id`]
    if (typeof ownId === "string") ids.push(ownId)
  }
  expect(ids.length).toBe(circuitJson.length)
  expect(new Set(ids).size).toBe(ids.length)
})

test("smoothieboard: non-numeric and rotated pin names survive conversion", () => {
  const portNames = new Set(byType("source_port").map((p) => p.name))
  // Tantalum capacitor pins are named A / C and carry a (rotate 90) group
  expect(portNames.has("C7-A")).toBe(true)
  expect(portNames.has("C7-C")).toBe(true)
  // Polarized capacitor pins are named + and -
  expect(portNames.has("C60-+")).toBe(true)
  expect(portNames.has("C60--")).toBe(true)
  // Crystal ground pins
  expect(portNames.has("Q2-GND1")).toBe(true)
  expect(portNames.has("Q2-GND2")).toBe(true)
  // No pin was misread as the literal string "rotate"
  for (const name of portNames) {
    expect(name.includes("rotate")).toBe(false)
  }
})

test("smoothieboard: parser reads pin names and rotation past (rotate N)", () => {
  const eia = dsnJson.library.images.find((img) =>
    img.name.includes("EIA3216"),
  )!
  expect(eia.pins.map((p) => p.pin_number)).toEqual(["A", "C"])
  expect(eia.pins.map((p) => p.rotation)).toEqual([90, 90])

  const panasonic = dsnJson.library.images.find((img) =>
    img.name.includes("PANASONIC_E"),
  )!
  expect(panasonic.pins.map((p) => p.pin_number)).toEqual(["+", "-"])
})

test("getPinNum skips the (rotate N) group", () => {
  const atom = (value: string | number) => ({ type: "Atom" as const, value })
  const list = (children: any[]) => ({ type: "List" as const, children })
  // (pin PADSTACK (rotate 90) A 1400 0)
  expect(
    getPinNum([
      atom("pin"),
      atom("PADSTACK"),
      list([atom("rotate"), atom(90)]),
      atom("A"),
      atom(1400),
      atom(0),
    ] as any),
  ).toBe("A")
  // (pin PADSTACK 2 100 0)
  expect(
    getPinNum([
      atom("pin"),
      atom("PADSTACK"),
      atom(2),
      atom(100),
      atom(0),
    ] as any),
  ).toBe(2)
})

test("tokenizer keeps a lone '-' as a symbol instead of NaN", () => {
  const tokens = tokenizeDsn("(pin PAD - -3000 0)")
  for (const token of tokens) {
    expect(typeof token.value === "number" && Number.isNaN(token.value)).toBe(
      false,
    )
  }
  expect(tokens.some((t) => t.type === "Symbol" && t.value === "-")).toBe(true)
})

test("smoothieboard: placement rotation is applied to port positions", () => {
  // JP36 is placed at rotation 270; rotate its pins' offsets by hand with
  // the standard CCW formula and compare against the emitted pcb_ports
  const image = dsnJson.library.images.find((img) =>
    img.name.startsWith("Jumper:SolderJumper-2"),
  )!
  const component = dsnJson.placement.components.find(
    (c) => c.name === image.name,
  )!
  const place = component.places.find((p) => p.refdes === "JP36")!
  expect(place.rotation).toBe(270)

  const pcbPorts = byType("pcb_port")
  for (const pin of image.pins) {
    const rad = (place.rotation * Math.PI) / 180
    const expected = {
      x: (place.x + pin.x * Math.cos(rad) - pin.y * Math.sin(rad)) / 1000,
      y: (place.y + pin.x * Math.sin(rad) + pin.y * Math.cos(rad)) / 1000,
    }
    const port = pcbPorts.find((p) =>
      p.pcb_port_id.includes(`-Pad${pin.pin_number}_JP36`),
    )!
    expect(port).toBeDefined()
    expect(Math.abs(port.x - expected.x)).toBeLessThan(1e-6)
    expect(Math.abs(port.y - expected.y)).toBeLessThan(1e-6)
  }
})

test("smoothieboard: back-side components get bottom-layer pads", () => {
  const backPlace = dsnJson.placement.components
    .flatMap((c) => c.places.map((p) => ({ component: c, place: p })))
    .find(({ place }) => place.side === "back")!
  expect(backPlace).toBeDefined()
  const pads = byType("pcb_smtpad").filter(
    (pad) =>
      pad.pcb_component_id ===
      `${backPlace.component.name}_${backPlace.place.refdes}`,
  )
  expect(pads.length).toBeGreaterThan(0)
  for (const pad of pads) {
    expect(pad.layer).toBe("bottom")
  }
})

test("smoothieboard: image keepouts are converted per placement", () => {
  const expectedCount = dsnJson.library.images.reduce((sum, image) => {
    const places =
      dsnJson.placement.components.find((c) => c.name === image.name)?.places
        .length ?? 0
    return sum + (image.keepouts?.length ?? 0) * places
  }, 0)
  const keepouts = byType("pcb_keepout")
  expect(keepouts.length).toBe(expectedCount)
  expect(keepouts.length).toBeGreaterThan(0)
  for (const keepout of keepouts) {
    expect(keepout.shape).toBe("circle")
    expect(keepout.radius).toBeGreaterThan(0)
    expect(["top", "inner1", "inner2", "bottom"]).toContain(keepout.layers[0])
  }
})

test("smoothieboard: AGND structure plane becomes a copper pour on inner1", () => {
  const pours = byType("pcb_copper_pour")
  expect(pours.length).toBe(1)
  expect(pours[0].layer).toBe("inner1")
  expect(pours[0].source_net_id).toBe("source_net_AGND")
  expect(pours[0].points.length).toBe(4)
})

test("smoothieboard: pad/port cross-references resolve", () => {
  const pcbPortIds = new Set(byType("pcb_port").map((p) => p.pcb_port_id))
  for (const el of [...byType("pcb_smtpad"), ...byType("pcb_plated_hole")]) {
    expect(pcbPortIds.has(el.pcb_port_id)).toBe(true)
  }
  const sourcePortIds = new Set(
    byType("source_port").map((p) => p.source_port_id),
  )
  for (const port of byType("pcb_port")) {
    expect(sourcePortIds.has(port.source_port_id)).toBe(true)
  }
})
