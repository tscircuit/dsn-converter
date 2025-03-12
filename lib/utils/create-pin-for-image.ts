import type { PcbSmtPad } from "circuit-json"

import type { PcbComponent, SourcePort } from "circuit-json"
import type { Pin } from "lib"
import { getPadstackName } from "./get-padstack-name"

export function createPinForImage(
    pad: any,
    pcbComponent: PcbComponent,
    sourcePort: SourcePort | undefined
): Pin | undefined {
    if (!sourcePort) return undefined

    const padstackParams = {
        shape: pad.shape === "circle" ? "circle" as const : "rect" as const,
        width: pad.shape === "circle" ? pad.radius * 1000 : pad.width * 1000,
        height: pad.shape === "circle" ? pad.radius * 1000 : pad.height * 1000,
        layer: pad.layer as PcbSmtPad["layer"],
    }

    return {
        padstack_name: getPadstackName(padstackParams),
        pin_number: sourcePort.port_hints?.find(
            (hint) => !Number.isNaN(Number(hint))
        ) || 1,
        x: (pad.x - pcbComponent.center.x) * 1000,
        y: (pad.y - pcbComponent.center.y) * 1000,
    }
}