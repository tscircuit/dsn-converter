import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Known modifier keywords that can appear between the padstack name and the pin identifier
 * in DSN pin definitions. These must be skipped when extracting the pin identifier.
 * Example: (pin Rect[T]Pad_1600x1400_um (rotate 90) A 1400 0)
 */
const PIN_MODIFIER_KEYWORDS = new Set(["rotate", "mirror", "flip"])

/**
 * Process pin identifier from AST nodes and convert to appropriate type.
 * Handles both extraction from nodes and type conversion in one step.
 *
 * DSN pin formats:
 *   (pin <padstack_name> <pin_id> <x> <y>)                         — simple
 *   (pin <padstack_name> (<modifier> <value>) <pin_id> <x> <y>)    — with rotation/mirror
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  // nodes[0] is the keyword "pin" (already consumed as the list key by the caller)
  // nodes[1] is the padstack name
  // nodes[2] is EITHER a modifier List (rotate/mirror/flip) OR the pin identifier Atom
  // nodes[3] is the pin identifier Atom when nodes[2] is a modifier

  let pinNumber: string | number | undefined

  if (nodes[2]?.type === "List" && nodes[2].children) {
    const modifierName = String(nodes[2].children[0]?.value ?? "")
    if (PIN_MODIFIER_KEYWORDS.has(modifierName)) {
      // Skip the modifier — pin identifier is at nodes[3]
      if (nodes[3]?.type === "Atom") {
        pinNumber = nodes[3].value
      } else {
        debug("Unsupported pin number format after modifier:", nodes)
        return null
      }
    } else {
      // Unknown List at position 2 — legacy behaviour: use first child as pin number
      pinNumber = nodes[2].children[0]?.value
    }
  } else if (nodes[2]?.type === "Atom") {
    // Pin number is direct value
    pinNumber = nodes[2].value
  } else {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  if (pinNumber === undefined) return null

  // Now process the extracted/direct value
  if (typeof pinNumber === "number") {
    return pinNumber
  }

  // Try parsing as an integer (e.g. "1", "100") — preserve string identifiers like "GND1", "A"
  const pinStr = String(pinNumber)
  const parsed = parseInt(pinStr, 10)
  // Only treat as number if the entire string is numeric (avoid "1A" → 1)
  return !Number.isNaN(parsed) && String(parsed) === pinStr ? parsed : pinStr
}
