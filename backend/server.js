require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(cors({
  origin: (origin, callback) => {
    // Allow command-line/API tools with no Origin header, plus the configured frontend.
    if (!origin || !FRONTEND_URL || origin === FRONTEND_URL) return callback(null, true);
    return callback(new Error("CORS blocked this origin"));
  }
}));
app.use(express.json());

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, trim: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  department: { type: String, required: true, trim: true },
  semester: { type: Number, required: true, min: 1, max: 12 },
  contact: { type: String, trim: true, default: "" }
}, { timestamps: true });

const Student = mongoose.model("Student", studentSchema);

app.get("/", (_req, res) => {
  res.json({ message: "Student Management API is running" });
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, database: mongoose.connection.readyState === 1 ? "connected" : "not connected" });
});

app.get("/api/students", async (_req, res, next) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (error) { next(error); }
});

app.get("/api/students/:id", async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student });
  } catch (error) { next(error); }
});

app.post("/api/students", async (req, res, next) => {
  try {
    const { studentId, name, email, department, semester, contact = "" } = req.body;
    if (![studentId, name, email, department, semester].every(v => v !== undefined && String(v).trim() !== "")) {
      return res.status(400).json({ success: false, message: "Please fill all required fields." });
    }
    const student = await Student.create({ studentId, name, email, department, semester: Number(semester), contact });
    res.status(201).json({ success: true, message: "Student added successfully.", data: student });
  } catch (error) { next(error); }
});

app.put("/api/students/:id", async (req, res, next) => {
  try {
    const allowed = ["studentId", "name", "email", "department", "semester", "contact"];
    const update = {};
    for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
    if (update.semester !== undefined) update.semester = Number(update.semester);
    const student = await Student.findByIdAndUpdate(req.params.id, update, {
      new: true, runValidators: true
    });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student updated successfully.", data: student });
  } catch (error) { next(error); }
});

app.delete("/api/students/:id", async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student deleted successfully." });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: "This Student ID is already in use." });
  }
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error.message === "CORS blocked this origin") {
    return res.status(403).json({ success: false, message: error.message });
  }
  console.error(error);
  res.status(500).json({ success: false, message: "Server error. Check backend logs." });
});

async function start() {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes("paste_your")) {
    console.error("Missing MONGODB_URI. Create backend/.env using .env.example and add your Atlas connection string.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => console.log(`API running on port ${PORT}`));
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  }
}
start();