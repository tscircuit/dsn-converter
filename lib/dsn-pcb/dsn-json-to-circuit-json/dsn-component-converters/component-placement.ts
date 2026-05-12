import type { ComponentPlacement, Image, Pin } from "lib/dsn-pcb/types"

type DsnPlace = ComponentPlacement["places"][number]

export function getDsnPcbComponentId(componentName: string, refdes: string) {
  return `${componentName}_${refdes}`
}

export function getDsnSourceComponentId(componentName: string, refdes: string) {
  return `sc_${componentName}_${refdes}`
}

function getPinIdPart(pin: Pin, pinIndex: number) {
  return `${pinIndex}_${String(pin.pin_number)}`
}

export function getDsnPcbSmtPadId({
  componentName,
  refdes,
  pin,
  pinIndex,
}: {
  componentName: string
  refdes: string
  pin: Pin
  pinIndex: number
}) {
  return `pcb_smtpad_${componentName}_${refdes}_${getPinIdPart(pin, pinIndex)}`
}

export function getDsnPcbPortId({
  componentName,
  refdes,
  pin,
  pinIndex,
}: {
  componentName: string
  refdes: string
  pin: Pin
  pinIndex: number
}) {
  return `pcb_port_${componentName}-Pad${getPinIdPart(pin, pinIndex)}_${refdes}`
}

export function getDsnSourcePortId({
  componentName,
  refdes,
  pin,
  pinIndex,
}: {
  componentName: string
  refdes: string
  pin: Pin
  pinIndex: number
}) {
  return `source_port_${componentName}-Pad${getPinIdPart(pin, pinIndex)}_${refdes}`
}

export function normalizeRotation(rotation = 0) {
  return ((rotation % 360) + 360) % 360
}

export function getNumericPinNumber(pin: Pin): number | undefined {
  if (typeof pin.pin_number === "number") return pin.pin_number

  return /^-?\d+$/.test(pin.pin_number) ? Number(pin.pin_number) : undefined
}

export function transformPinOffset(pin: Pin, place: DsnPlace) {
  const mirroredX = place.side === "back" ? -pin.x : pin.x
  const rotation = (normalizeRotation(place.rotation) * Math.PI) / 180
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)

  return {
    x: mirroredX * cos - pin.y * sin,
    y: mirroredX * sin + pin.y * cos,
  }
}

export function getImageBounds(image: Image) {
  const points: Array<{ x: number; y: number }> = []

  for (const pin of image.pins ?? []) {
    points.push({ x: pin.x, y: pin.y })
  }

  for (const outline of image.outlines ?? []) {
    const coordinates = outline.path?.coordinates ?? []
    for (let i = 0; i < coordinates.length; i += 2) {
      if (
        typeof coordinates[i] === "number" &&
        typeof coordinates[i + 1] === "number"
      ) {
        points.push({ x: coordinates[i], y: coordinates[i + 1] })
      }
    }
  }

  if (points.length === 0) {
    return { width: 0, height: 0 }
  }

  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)

  return {
    width: (Math.max(...xs) - Math.min(...xs)) / 1000,
    height: (Math.max(...ys) - Math.min(...ys)) / 1000,
  }
}
