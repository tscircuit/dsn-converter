import { expect, test } from "bun:test"
import type { PcbSmtPad } from "circuit-json"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

/**
 * `B_Cu` / `F_Cu` (underscore) are accepted copper-layer aliases alongside
 * `B.Cu` / `F.Cu` and `Top` / `Bottom` — see FRONT_COPPER / BACK_COPPER in
 * convert-padstacks-to-smtpads.
 *
 * Layer classification has to agree across all three spellings. A pad authored
 * on back copper must land on `bottom` when placed front, and mirror to `top`
 * when the component is placed on the back.
 */
const buildDsn = ({
  backLayerName,
  side,
}: {
  backLayerName: string
  side: "front" | "back"
}) => `(pcb "alias-test.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "(5.1.9)-1")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
      (property
        (index 0)
      )
    )
    (layer ${backLayerName}
      (type signal)
      (property
        (index 1)
      )
    )
    (boundary
      (path pcb 0  0 0  20000 0  20000 -20000  0 -20000  0 0)
    )
  )
  (placement
    (component TestPad
      (place P1 10000 -10000 ${side} 0 (PN TESTPAD))
    )
  )
  (library
    (image TestPad
      (pin BackPad 1 0 0)
    )
    (padstack BackPad
      (shape (rect ${backLayerName} -500 -500 500 500))
      (attach off)
    )
  )
  (network
  )
  (wiring
  )
)
`

const padLayerFor = ({
  backLayerName,
  side,
}: {
  backLayerName: string
  side: "front" | "back"
}) => {
  const dsnPcb = parseDsnToDsnJson(buildDsn({ backLayerName, side })) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnPcb)
  const pads = circuitJson.filter(
    (element): element is PcbSmtPad => element.type === "pcb_smtpad",
  )

  expect(pads).toHaveLength(1)
  return pads[0]!.layer
}

test("back-copper pads classify the same across B.Cu, Bottom and B_Cu", () => {
  for (const backLayerName of ["B.Cu", "Bottom", "B_Cu"]) {
    // Authored on back copper, component placed front → stays on bottom.
    expect({
      backLayerName,
      layer: padLayerFor({ backLayerName, side: "front" }),
    }).toEqual({ backLayerName, layer: "bottom" })

    // Same pad on a back-placed component → mirrors to top.
    expect({
      backLayerName,
      layer: padLayerFor({ backLayerName, side: "back" }),
    }).toEqual({ backLayerName, layer: "top" })
  }
})
