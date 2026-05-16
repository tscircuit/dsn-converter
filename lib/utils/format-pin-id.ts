export const formatPinId = (pinNumber: number | string): string =>
  String(pinNumber).replace(/[^a-zA-Z0-9_+-]/g, "_")
