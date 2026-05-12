import type { Resolution } from "./types"

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
