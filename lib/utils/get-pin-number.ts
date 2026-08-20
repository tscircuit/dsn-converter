import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

/**
 * Process pin identifier from AST nodes and convert to appropriate type
 * Handles both extraction from nodes and type conversion in one step
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  // Extract pin number from AST nodes
  let pinNumber

  for (const node of nodes.slice(2)) {
    if (node.type === "List") {
      if (
        node.children?.[0]?.type === "Atom" &&
        node.children[0].value === "rotate"
      ) {
        continue
      }

      pinNumber = node.children?.[0]?.value
      break
    }

    if (node.type === "Atom") {
      pinNumber = node.value
      break
    }
  }

  if (pinNumber === undefined) {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  // Now process the extracted/direct value
  if (typeof pinNumber === "number") {
    return pinNumber
  }
  // Try parsing as number first
  const parsed = parseInt(String(pinNumber), 10)
  return Number.isNaN(parsed) ? String(pinNumber) : parsed
}
