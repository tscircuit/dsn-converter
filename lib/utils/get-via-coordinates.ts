import type { ASTNode } from "../common/parse-sexpr"
import Debug from "debug"

const debug = Debug("dsn-converter:getViaCoords")

/**
 * Extract coordinates from via nodes, handling both path and direct coordinate formats
 */
export function getViaCoords(
  nodes: ASTNode[],
): { x: number; y: number } | null {
  try {
    // Check for direct coordinates format (index 2 and 3)
    if (
      nodes[2]?.type === "Atom" &&
      typeof nodes[2].value === "number" &&
      nodes[3]?.type === "Atom" &&
      typeof nodes[3].value === "number"
    ) {
      return {
        x: nodes[2].value,
        y: nodes[3].value,
      }
    }

    // Check for path format
    const pathNode = nodes.find(
      (node) =>
        node.type === "List" &&
        node.children?.[0]?.type === "Atom" &&
        node.children[0].value === "path",
    )

    if (pathNode?.children) {
      const coords = pathNode.children
        .filter(
          (node) => node.type === "Atom" && typeof node.value === "number",
        )
        .slice(-2)

      if (coords.length === 2) {
        return {
          x: coords[0].value as number,
          y: coords[1].value as number,
        }
      }
    }

    debug("Could not extract coordinates from via nodes:", nodes)
    return null
  } catch (error) {
    debug("Error extracting via coordinates:", error)
    return null
  }
}
