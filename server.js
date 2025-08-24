import express from "express";
import ejs from "ejs";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { readExcel } from "./utils/readExcel.js";
import { toBase64Image } from "./utils/helpers.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/static", express.static(path.join(__dirname, "public")));


// Students data from Excel
// Excel columns: RollNo, Name, Class, FatherName, PhotoPath
const rawStudents = readExcel(path.join(__dirname, "data10th.xlsx"));

const students = rawStudents.map((st) => {
  const imgAbs = path.join(__dirname, "public", "images", String(st.PhotoPath || "").trim());
  //console.log("Image path:", imgAbs); // Debugging
  return {
    ...st,
    PhotoBase64: toBase64Image(imgAbs, st.Name || "Photo")
  };
});

// 10th datesheet (same for all)
const datesheet = [
  { date: "15-09-2025", subject: "Science" },
  { date: "17-09-2025", subject: "Hindi" },
  { date: "19-09-2025", subject: "Maths" },
  { date: "20-09-2025", subject: "Music" },
  { date: "24-09-2025", subject: "S.st" },
  { date: "25-09-2025", subject: "English" }
];

function toBase64ImageLogo(filePath) {
  try {
    const img = fs.readFileSync(filePath);
    const ext = path.extname(filePath).substring(1);
    return `data:image/${ext};base64,${img.toString("base64")}`;
  } catch {
    return "";
  }
}
const logoPath = path.join(__dirname, "public", "images", "logo.jpg");
const logoBase64 = toBase64ImageLogo(logoPath);



// Preview in browser
app.get("/", (req, res) => {
  res.render("slips", { students, datesheet, logoBase64  });
});


// Generate PDF for all roll numbers
app.get("/generate-pdf", async (req, res) => {
  try {
    const html = await ejs.renderFile(
      path.join(__dirname, "views", "slips.ejs"),
      { students, datesheet, logoBase64 },   // 👈 passing all students
      { async: true }
    );

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "8mm", bottom: "8mm", left: "8mm", right: "8mm" }
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=rollnoslips.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF generation error: " + err.message);
  }
});


app.get("/:rollno", (req, res) => {
  const rollno = req.params.rollno;

  const student = students.find(st => st.RollNo === rollno);

  if (!student) {
    return res.status(404).send("Student not found.");
  }

  res.render("slips", { students: [student], datesheet, logoBase64 });
});


app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
