import type { DsnSession } from "../types"

export const stringifyDsnSession = (session: DsnSession): string => {
  const indent = "  "
  let result = ""

  // Start with session
  result += `(session ${session.filename}\n`

  // Base design
  result += `${indent}(base_design ${session.filename})\n`

  // Placement section
  result += `${indent}(placement\n`
  result += `${indent}${indent}(resolution ${session.placement.resolution.unit} ${session.placement.resolution.value})\n`
  session.placement.components.forEach((component) => {
    result += `${indent}${indent}(component ${component.name}\n`
    component.places.forEach((place) => {
      result += `${indent}${indent}${indent}(place ${place.refdes} ${place.x} ${place.y} ${place.side} ${place.rotation})\n`
    })
    result += `${indent}${indent})\n`
  })
  result += `${indent})\n`

  // Was_is section (if needed)
  result += `${indent}(was_is\n${indent})\n`

  // Routes section
  result += `${indent}(routes \n`
  result += `${indent}${indent}(resolution ${session.routes.resolution.unit} ${session.routes.resolution.value})\n`

  // Parser subsection
  result += `${indent}${indent}(parser\n`
  result += `${indent}${indent}${indent}(host_cad ${JSON.stringify(session.routes.parser.host_cad)})\n`
  result += `${indent}${indent}${indent}(host_version ${JSON.stringify(session.routes.parser.host_version)})\n`
  result += `${indent}${indent})\n`

  // Library_out subsection
  if (session.routes.library_out) {
    result += `${indent}${indent}(library_out \n`
    session.routes.library_out.padstacks.forEach((padstack) => {
      result += `${indent}${indent}${indent}(padstack ${JSON.stringify(padstack.name)}\n`
      padstack.shapes.forEach((shape) => {
        if (shape.shapeType === "circle") {
          result += `${indent}${indent}${indent}${indent}(shape\n`
          result += `${indent}${indent}${indent}${indent}${indent}(circle ${shape.layer} ${shape.diameter} 0 0)\n`
          result += `${indent}${indent}${indent}${indent})\n`
        }
      })
      result += `${indent}${indent}${indent}${indent}(attach ${padstack.attach})\n`
      result += `${indent}${indent}${indent})\n`
    })
    result += `${indent}${indent})\n`
  }

  // Network_out subsection
  result += `${indent}${indent}(network_out \n`
  session.routes.network_out.nets.forEach((net) => {
    result += `${indent}${indent}${indent}(net ${JSON.stringify(net.name)}\n`
    net.wires.forEach((wire) => {
      if (wire.path) {
        result += `${indent}${indent}${indent}${indent}(wire\n`
        result += `${indent}${indent}${indent}${indent}${indent}(path ${wire.path.layer} ${wire.path.width}\n`
        result += `${indent}${indent}${indent}${indent}${indent}${indent}${wire.path.coordinates.join(" ")}\n`
        result += `${indent}${indent}${indent}${indent}${indent})\n`
        result += `${indent}${indent}${indent}${indent})\n`
      }
    })
    result += `${indent}${indent}${indent})\n`
  })
  result += `${indent}${indent})\n`

  result += `${indent})\n`

  // Close session
  result += `)\n`

  return result
}
