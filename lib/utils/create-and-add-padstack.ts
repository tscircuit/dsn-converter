import type { Padstack } from "lib"
import type { PcbSmtPad } from "circuit-json"
import { getPadstackName } from "./get-padstack-name"
import type { DsnPcb } from "lib"
import { createCircularPadstack, createRectangularPadstack } from "./create-padstack"

export function createAndAddPadstack(
    pcb: DsnPcb,
    pad: any,
    processedPadstacks: Set<string>
): string {
    const padstackParams = {
        shape: pad.shape === "circle" ? "circle" as const : "rect" as const,
        width: pad.shape === "circle" ? pad.radius * 1000 : pad.width * 1000,
        height: pad.shape === "circle" ? pad.radius * 1000 : pad.height * 1000,
        layer: pad.layer as PcbSmtPad["layer"],
    }

    const padstackName = getPadstackName(padstackParams)

    if (!processedPadstacks.has(padstackName)) {
        let padstack: Padstack

        if (pad.shape === "circle") {
            padstack = createCircularPadstack(
                padstackName,
                padstackParams.width,
                padstackParams.height
            )
        } else {
            // rect or rotated_rect
            padstack = createRectangularPadstack(
                padstackName,
                padstackParams.width,
                padstackParams.height,
                pad.layer
            )
        }

        pcb.library.padstacks.push(padstack)
        processedPadstacks.add(padstackName)
    }

    return padstackName
}