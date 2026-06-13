const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  
  const assetsDir = path.join(__dirname, "assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: assetsDir,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();
  
  try {
    console.log("Loading and preparing HTML content...");
    const htmlTemplatePath = path.join(assetsDir, "render_svg.html");
    let htmlContent = fs.readFileSync(htmlTemplatePath, "utf-8");

    const svgPath = path.join(assetsDir, "smoothieboard_repro.svg");
    const svgContent = fs.readFileSync(svgPath, "utf-8");

    // Inject SVG content directly to avoid CORS issues
    htmlContent = htmlContent.replace(
      `<script>\n    fetch('smoothieboard_repro.svg')\n      .then(res => res.text())\n      .then(svgText => {\n        document.getElementById('svg-container').innerHTML = svgText;\n      });\n  </script>`,
      `<script>\n    document.getElementById('svg-container').innerHTML = \`${svgContent.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;\n  </script>`
    );

    console.log("Setting page content...");
    await page.setContent(htmlContent);
    await page.waitForTimeout(2000);

    console.log("Showing converted Smoothieboard PCB SVG layout...");
    await page.waitForTimeout(6000);

  } catch (error) {
    console.error("An error occurred during automation:", error);
  } finally {
    console.log("Closing context and saving video...");
    await context.close();
    await browser.close();
    
    const files = fs.readdirSync(assetsDir);
    const videoFile = files.find(f => f.endsWith(".webm") && f !== "smoothieboard_demo.webm");
    if (videoFile) {
      const oldPath = path.join(assetsDir, videoFile);
      const newPath = path.join(assetsDir, "smoothieboard_demo.webm");
      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath);
      }
      fs.renameSync(oldPath, newPath);
      console.log(`Video demo successfully saved and renamed to: ${newPath}`);
    } else {
      console.log("Video file not found or not created.");
    }
  }
}

main();
