import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getViaCoords")

const toFiniteNumber = (node: ASTNode | undefined): number | null => {
  if (!node || node.type !== "Atom") return null
  if (typeof node.value === "number") {
    return Number.isFinite(node.value) ? node.value : null
  }
  if (typeof node.value === "string" && node.value.trim() !== "") {
    const parsed = Number(node.value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/**
 * Extract coordinates from via nodes, handling both path and direct coordinate formats
 */
export function getViaCoords(
  nodes: ASTNode[],
): { x: number; y: number } | null {
  try {
    // Check for direct coordinates format (index 2 and 3)
    const directX = toFiniteNumber(nodes[2])
    const directY = toFiniteNumber(nodes[3])
    if (directX !== null && directY !== null) {
      return {
        x: directX,
        y: directY,
      }
    }

    // Check for path format: (path <layer> <aperture_width> <x> <y> ...)
    const pathNode = nodes.find(
      (node) =>
        node.type === "List" &&
        node.children?.[0]?.type === "Atom" &&
        node.children[0].value === "path",
    )

    if (pathNode?.children && pathNode.children.length >= 5) {
      const coords = pathNode.children
        .slice(3)
        .map((node) => toFiniteNumber(node))
        .filter((value): value is number => value !== null)
        .slice(-2)

      if (coords.length === 2) {
        return {
          x: coords[0],
          y: coords[1],
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
