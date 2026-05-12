import type { DsnPcb } from "../types"

export const stringifyDsnJson = (dsnJson: DsnPcb): string => {
  const indent = "  "
  let result = ""

  // Helper function to stringify a value with proper formatting
  const stringifyValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '""'
    }
    if (typeof value === "string") {
      return `"${value}"`
    }
    return value.toString()
  }

  // Helper function to stringify an array of coordinates
  const stringifyCoordinates = (coordinates: number[]): string => {
    return coordinates.join(" ")
  }

  // Helper function to stringify a path
  const stringifyPath = (path: any, level: number): string => {
    const padding = indent.repeat(level)
    return `${padding}(path ${path.layer} ${path.width}  ${stringifyCoordinates(path.coordinates)})`
  }

  const stringifyAutorouteSettings = (
    settings: NonNullable<DsnPcb["structure"]["autoroute_settings"]>,
    level: number,
  ): string => {
    const padding = indent.repeat(level)
    const childPadding = indent.repeat(level + 1)
    const lines = [`${padding}(autoroute_settings`]

    if (settings.fanout !== undefined) {
      lines.push(`${childPadding}(fanout ${settings.fanout})`)
    }
    if (settings.autoroute !== undefined) {
      lines.push(`${childPadding}(autoroute ${settings.autoroute})`)
    }
    if (settings.postroute !== undefined) {
      lines.push(`${childPadding}(postroute ${settings.postroute})`)
    }
    if (settings.vias !== undefined) {
      lines.push(`${childPadding}(vias ${settings.vias})`)
    }
    if (settings.via_costs !== undefined) {
      lines.push(`${childPadding}(via_costs ${settings.via_costs})`)
    }
    if (settings.plane_via_costs !== undefined) {
      lines.push(`${childPadding}(plane_via_costs ${settings.plane_via_costs})`)
    }
    if (settings.start_ripup_costs !== undefined) {
      lines.push(
        `${childPadding}(start_ripup_costs ${settings.start_ripup_costs})`,
      )
    }
    if (settings.start_pass_no !== undefined) {
      lines.push(`${childPadding}(start_pass_no ${settings.start_pass_no})`)
    }

    settings.layer_rules.forEach((layerRule) => {
      lines.push(`${childPadding}(layer_rule ${layerRule.layer}`)
      const layerRulePadding = indent.repeat(level + 2)
      if (layerRule.active !== undefined) {
        lines.push(`${layerRulePadding}(active ${layerRule.active})`)
      }
      if (layerRule.preferred_direction !== undefined) {
        lines.push(
          `${layerRulePadding}(preferred_direction ${layerRule.preferred_direction})`,
        )
      }
      if (layerRule.preferred_direction_trace_costs !== undefined) {
        lines.push(
          `${layerRulePadding}(preferred_direction_trace_costs ${layerRule.preferred_direction_trace_costs})`,
        )
      }
      if (layerRule.against_preferred_direction_trace_costs !== undefined) {
        lines.push(
          `${layerRulePadding}(against_preferred_direction_trace_costs ${layerRule.against_preferred_direction_trace_costs})`,
        )
      }
      lines.push(`${childPadding})`)
    })

    lines.push(`${padding})`)
    return lines.join("\n")
  }

  // Start with pcb
  result += `(pcb ${dsnJson.filename ? dsnJson.filename : "./converted_dsn.dsn"}\n`

  // Parser section
  result += `${indent}(parser\n`
  result += `${indent}${indent}(string_quote ")\n`
  result += `${indent}${indent}(space_in_quoted_tokens on)\n`
  result += `${indent}${indent}(host_cad "KiCad's Pcbnew")\n`
  result += `${indent}${indent}(host_version "${dsnJson.parser.host_version}")\n`
  result += `${indent})\n`

  // Resolution and unit
  result += `${indent}(resolution ${dsnJson.resolution.unit} ${dsnJson.resolution.value})\n`
  result += `${indent}(unit ${dsnJson.unit})\n`

  // Structure section
  result += `${indent}(structure\n`
  dsnJson.structure.layers.forEach((layer) => {
    result += `${indent}${indent}(layer ${layer.name}\n`
    result += `${indent}${indent}${indent}(type ${layer.type})\n`
    result += `${indent}${indent}${indent}(property\n`
    result += `${indent}${indent}${indent}${indent}(index ${layer.property.index})\n`
    result += `${indent}${indent}${indent})\n`
    result += `${indent}${indent})\n`
  })
  if (dsnJson.structure.boundary) {
    result += `${indent}${indent}(boundary\n`
    result += `${indent}${indent}${indent}${stringifyPath(dsnJson.structure.boundary.path, 0)}\n`
    result += `${indent}${indent})\n`
  }
  result += `${indent}${indent}(via ${stringifyValue(dsnJson.structure.via)})\n`
  result += `${indent}${indent}(rule\n`
  result += `${indent}${indent}${indent}(width ${dsnJson.structure.rule.width})\n`
  dsnJson.structure.rule.clearances.forEach((clearance) => {
    result += `${indent}${indent}${indent}(clearance ${clearance.value}${clearance.type ? ` (type ${clearance.type})` : ""})\n`
  })
  result += `${indent}${indent})\n`
  if (dsnJson.structure.autoroute_settings) {
    result += `${stringifyAutorouteSettings(dsnJson.structure.autoroute_settings, 2)}\n`
  }
  result += `${indent})\n`

  // Placement section
  result += `${indent}(placement\n`
  dsnJson.placement.components.forEach((component) => {
    result += `${indent}${indent}(component ${stringifyValue(component.name)}\n`
    if (component.places) {
      component.places.forEach((place) => {
        result += `${indent}${indent}${indent}(place ${place.refdes} ${place.x} ${place.y} ${place.side} ${place.rotation}${place.PN ? ` (PN ${stringifyValue(place.PN)})` : ""})\n`
      })
    }
    result += `${indent}${indent})\n`
  })
  result += `${indent})\n`

  // Library section
  result += `${indent}(library\n`
  dsnJson.library.images.forEach((image) => {
    result += `${indent}${indent}(image ${stringifyValue(image.name)}\n`
    image.outlines.forEach((outline) => {
      result += `${indent}${indent}${indent}(outline ${stringifyPath(outline.path, 4)})\n`
    })
    image.pins.forEach((pin) => {
      result += `${indent}${indent}${indent}(pin ${pin.padstack_name} ${pin.pin_number} ${pin.x} ${pin.y})\n`
    })
    result += `${indent}${indent})\n`
  })
  dsnJson.library.padstacks.forEach((padstack) => {
    result += `${indent}${indent}(padstack ${stringifyValue(padstack.name)}\n`
    padstack.shapes.forEach((shape) => {
      if (shape.shapeType === "polygon") {
        result += `${indent}${indent}${indent}(shape (polygon ${shape.layer} ${shape.width} ${stringifyCoordinates(shape.coordinates)}))\n`
      } else if (shape.shapeType === "circle") {
        result += `${indent}${indent}${indent}(shape (circle ${shape.layer} ${shape.diameter}))\n`
      } else if (shape.shapeType === "path") {
        result += `${indent}${indent}${indent}(shape (path ${shape.layer} ${shape.width} ${stringifyCoordinates(shape.coordinates)}))\n`
      }
    })
    result += `${indent}${indent}${indent}(attach ${padstack.attach})\n`
    result += `${indent}${indent})\n`
  })
  result += `${indent})\n`

  // Network section
  result += `${indent}(network\n`
  dsnJson.network.nets.forEach((net) => {
    result += `${indent}${indent}(net ${stringifyValue(net.name)}\n`
    if (net.pins.length > 0) {
      result += `${indent}${indent}${indent}(pins ${net.pins.join(" ")})\n`
    }
    result += `${indent}${indent})\n`
  })
  dsnJson.network.classes.forEach((cls) => {
    result += `${indent}${indent}(class ${stringifyValue(cls.name)} ${stringifyValue(cls.description)}${cls.net_names.map((n) => ` ${stringifyValue(n)}`).join("")}\n`
    result += `${indent}${indent}${indent}(circuit\n`
    result += `${indent}${indent}${indent}${indent}(use_via ${stringifyValue(cls.circuit.use_via)})\n`
    result += `${indent}${indent}${indent})\n`
    if (cls.rule) {
      result += `${indent}${indent}${indent}(rule\n`
      result += `${indent}${indent}${indent}${indent}(width ${cls.rule.width})\n`
      cls.rule.clearances.forEach((clearance) => {
        result += `${indent}${indent}${indent}${indent}(clearance ${clearance.value}${clearance.type ? ` (type ${clearance.type})` : ""})\n`
      })
      result += `${indent}${indent}${indent})\n`
    }
    result += `${indent}${indent})\n`
  })
  result += `${indent})\n`

  // Wiring section
  result += `${indent}(wiring\n`
  ;(dsnJson.wiring?.wires ?? []).forEach((wire) => {
    if (wire.type === "via") {
      result += `${indent}${indent}(via ${stringifyPath(wire.path, 3)}(net ${stringifyValue(wire.net)}))\n`
    } else {
      result += `${indent}${indent}(wire ${stringifyPath(wire.path, 3)}(net ${stringifyValue(wire.net)})(type ${wire.type}))\n`
    }
  })
  result += `${indent})\n`

  // Close pcb
  result += `)\n`

  return result
}
