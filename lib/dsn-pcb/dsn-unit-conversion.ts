import type { Padstack, Resolution } from "./types"

function getResolutionValue(resolution?: Resolution): number {
  return resolution?.value && Number.isFinite(resolution.value)
    ? resolution.value
    : 1
}

function cleanDsnUnits(value: number): number {
  const rounded = Math.round(value)
  return Math.abs(value - rounded) < 1e-9 ? rounded : value
}

export function getDsnUnitsPerMm(resolution?: Resolution): number {
  const value = getResolutionValue(resolution)
  const unit = resolution?.unit?.toLowerCase() ?? "um"

  switch (unit) {
    case "mm":
      return value
    case "mil":
      return value / 0.0254
    case "inch":
    case "in":
      return value / 25.4
    case "um":
    default:
      return value * 1000
  }
}

export function getMmPerDsnUnit(resolution?: Resolution): number {
  return 1 / getDsnUnitsPerMm(resolution)
}

function getMmPerBaseUnit(resolution?: Resolution): number {
  const unit = resolution?.unit?.toLowerCase() ?? "um"

  switch (unit) {
    case "mm":
      return 1
    case "mil":
      return 0.0254
    case "inch":
    case "in":
      return 25.4
    case "um":
    default:
      return 1 / 1000
  }
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(1e-6, Math.abs(b) * 1e-6)
}

function getPhysicalMicronsFromPadstackName(name: string): number | undefined {
  const viaMatch = name.match(/_(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)_um$/)
  if (viaMatch) return Number(viaMatch[1])

  const roundMatch = name.match(/Pad_(\d+(?:\.\d+)?)_(\d+(?:\.\d+)?)_um$/)
  if (roundMatch) return Number(roundMatch[2])

  const sizeMatch = name.match(/Pad_(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)_um$/)
  if (sizeMatch) return Math.max(Number(sizeMatch[1]), Number(sizeMatch[2]))

  return undefined
}

function getObservedPadstackUnits(padstack: Padstack): number | undefined {
  for (const shape of padstack.shapes) {
    if (shape.shapeType === "circle") return shape.diameter
    if (shape.shapeType === "rect") {
      const [x1, y1, x2, y2] = shape.coordinates
      return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))
    }
    if (shape.shapeType === "polygon") {
      const xs: number[] = []
      const ys: number[] = []
      for (let i = 0; i < shape.coordinates.length; i += 2) {
        xs.push(shape.coordinates[i])
        ys.push(shape.coordinates[i + 1])
      }
      return Math.max(
        Math.max(...xs) - Math.min(...xs),
        Math.max(...ys) - Math.min(...ys),
      )
    }
  }

  return undefined
}

export function getMmPerDsnUnitForLibrary(
  resolution: Resolution | undefined,
  library?: { padstacks?: Padstack[] },
): number {
  const resolutionValue = getResolutionValue(resolution)

  for (const padstack of library?.padstacks ?? []) {
    const physicalMicrons = getPhysicalMicronsFromPadstackName(padstack.name)
    const observedUnits = getObservedPadstackUnits(padstack)
    if (physicalMicrons === undefined || observedUnits === undefined) continue

    if (nearlyEqual(observedUnits, physicalMicrons * resolutionValue)) {
      return getMmPerDsnUnit(resolution)
    }
    if (nearlyEqual(observedUnits, physicalMicrons)) {
      return getMmPerBaseUnit(resolution)
    }
  }

  return getMmPerDsnUnit(resolution)
}

export function mmToDsnUnits(mm: number, resolution?: Resolution): number {
  return cleanDsnUnits(mm * getDsnUnitsPerMm(resolution))
}

export function dsnUnitsToMm(
  dsnUnits: number,
  resolution?: Resolution,
): number {
  return dsnUnits * getMmPerDsnUnit(resolution)
}

export function micronsToDsnUnits(
  microns: number,
  resolution?: Resolution,
): number {
  return mmToDsnUnits(microns / 1000, resolution)
}
