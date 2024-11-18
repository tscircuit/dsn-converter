/**
 * @deprecated THIS DOES NOT WORK AT ALL!!!!!!!
 */
export function getFootprintName(componentType: string | undefined): string {
  switch (componentType) {
    case "simple_resistor":
      return "Resistor_SMD:R_0402_1005Metric"
    case "simple_capacitor":
      return "Capacitor_SMD:C_0603_1608Metric"
    default:
      return "Unknown_Footprint"
  }
}
