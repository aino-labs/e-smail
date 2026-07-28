import fs from "fs";
import path from "path";

const cssDir = path.resolve("build/css");

if (fs.existsSync(cssDir)) {
  const files = fs.readdirSync(cssDir).filter((file) => file.endsWith(".css"));

  for (const file of files) {
    const filePath = path.join(cssDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    // Check if BOM exists anywhere in the file
    if (content.includes("\uFEFF")) {
      console.error(`❌ ERROR: Found hidden BOM character in ${file}`);
      process.exit(1);
    }
  }
  console.log("✅ Production CSS build check passed (No BOM found).");
}
