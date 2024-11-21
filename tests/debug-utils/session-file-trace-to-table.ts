import fs from "node:fs"
import path from "node:path"

function formatNumber(num: number) {
  // Format number to 2 decimal places and remove trailing zeros
  return parseFloat(num.toFixed(2)).toString()
}

function extractWirePathPoints(sesContent: string) {
  const wirePathRegex = /path\s+([A-Za-z.]+)\s+([0-9.]+)\s+([\d.-\s]+)/g
  const paths = []

  let match: RegExpExecArray | null
  while (true) {
    match = wirePathRegex.exec(sesContent)
    if (match === null) break
    const layer = match[1]
    const width = match[2]
    const coordinates = match[3].trim().split(/\s+/)

    const points = []
    for (let i = 0; i < coordinates.length; i += 2) {
      points.push({
        x: parseFloat(coordinates[i]),
        y: parseFloat(coordinates[i + 1]),
      })
    }

    paths.push({
      layer,
      width,
      points,
    })
  }

  return paths
}

function generateMarkdownTable(paths: any, title?: string) {
  let markdown = title ? `# ${title}\n\n` : "# Wire Path Points Analysis\n\n"

  paths.forEach((path: any, index: number) => {
    markdown += `## Wire Path ${index + 1}\n`
    markdown += `- Layer: ${path.layer}\n`
    markdown += `- Width: ${path.width}mm\n\n`

    // Fixed width columns with padding
    markdown += "| Point # |    X (μm)    |    Y (μm)    |\n"
    markdown += "|---------|--------------|--------------||\n"

    path.points.forEach((point: any, pointIndex: number) => {
      const formattedX = formatNumber(point.x).padStart(12, " ")
      const formattedY = formatNumber(point.y).padStart(12, " ")
      markdown += `|    ${(pointIndex + 1).toString().padStart(2)}   |${formattedX}|${formattedY}|\n`
    })

    markdown += "\n"
  })

  return markdown
}

export function sessionFileToTable(
  sesContent: string,
  outputPath: string,
  title?: string,
) {
  try {
    const paths = extractWirePathPoints(sesContent)
    const markdown = generateMarkdownTable(paths, title)
    const resolvedOutputPath = path.resolve(__dirname, outputPath)
    fs.writeFileSync(resolvedOutputPath, markdown)
    console.log(`Wire path analysis has been written to ${resolvedOutputPath}`)

    return paths
  } catch (error) {
    console.error("Error processing file:", error)
    throw error
  }
}
