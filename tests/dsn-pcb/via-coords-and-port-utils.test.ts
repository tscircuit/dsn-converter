import { describe, expect, test } from "bun:test"
import { chunks } from "lib/utils/chunks"
import { getCombinedSourcePortName } from "lib/utils/get-combined-source-port-name"
import { getViaCoords } from "lib/utils/get-via-coordinates"
import { pairs } from "lib/utils/pairs"

describe("getViaCoords, getCombinedSourcePortName, pairs, and chunks", () => {
  test("getViaCoords ignores path layer and aperture width when coordinates are missing", () => {
    const truncatedPathNodes = [
      { type: "Atom" as const, value: "via" },
      { type: "Atom" as const, value: "Via[0-1]_600:300_um" },
      {
        type: "List" as const,
        children: [
          { type: "Atom" as const, value: "path" },
          { type: "Atom" as const, value: 1 },
          { type: "Atom" as const, value: 600 },
        ],
      },
    ]

    expect(getViaCoords(truncatedPathNodes)).toBeNull()
  })

  test("getViaCoords extracts numeric string coordinates in both direct and path formats", () => {
    expect(
      getViaCoords([
        { type: "Atom", value: "via" },
        { type: "Atom", value: "Via[0-1]_600:300_um" },
        { type: "Atom", value: "+1250.5" },
        { type: "Atom", value: "-750.25" },
      ]),
    ).toEqual({ x: 1250.5, y: -750.25 })

    expect(
      getViaCoords([
        { type: "Atom", value: "via" },
        { type: "Atom", value: "Via[0-1]_600:300_um" },
        {
          type: "List",
          children: [
            { type: "Atom", value: "path" },
            { type: "Atom", value: "F.Cu" },
            { type: "Atom", value: 600 },
            { type: "Atom", value: "2400" },
            { type: "Atom", value: "-1800" },
          ],
        },
      ]),
    ).toEqual({ x: 2400, y: -1800 })
  })

  test("getCombinedSourcePortName strips only leading case-insensitive pin prefixes", () => {
    const elements: any[] = [
      {
        type: "source_component",
        source_component_id: "source_component_1",
        name: "U1",
      },
      {
        type: "source_port",
        source_port_id: "source_port_1",
        source_component_id: "source_component_1",
        name: "PIN_1",
      },
      {
        type: "source_port",
        source_port_id: "source_port_2",
        source_component_id: "source_component_1",
        name: "spin1",
      },
    ]

    expect(
      getCombinedSourcePortName(elements, ["source_port_1", "source_port_2"]),
    ).toBe("Pad1_U1_source_component_1--Padspin1_U1_source_component_1")
  })

  test("pairs drops trailing odd element and chunks guards against non-positive sizes", () => {
    expect(pairs([10, 20, 30, 40, 50])).toEqual([
      [10, 20],
      [30, 40],
    ])
    expect(chunks([1, 2, 3, 4], 0)).toEqual([])
    expect(chunks([1, 2, 3, 4], -2)).toEqual([])
  })
})
