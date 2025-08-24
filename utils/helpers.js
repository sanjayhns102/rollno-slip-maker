import fs from "fs";

function mimeFromExt(filename) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export function toBase64Image(absPath, fallbackText = "No Photo") {
  try {
    const bin = fs.readFileSync(absPath);
    const mime = mimeFromExt(absPath);
    return `data:${mime};base64,${bin.toString("base64")}`;
  } catch {
    // Agar image missing hai to placeholder banega
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='140'>
        <rect width='100%' height='100%' fill='#eee'/>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
              font-family='Arial' font-size='12' fill='#666'>${fallbackText}</text>
      </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
}
