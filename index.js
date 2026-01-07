require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const AWS = require('aws-sdk');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/* -------------------- RDS CONNECTION -------------------- */
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error("❌ DB connection failed:", err);
    return;
  }
  console.log("✅ Connected to RDS MySQL");
});

/* -------------------- S3 CONFIG (IAM ROLE) -------------------- */
const s3 = new AWS.S3({
  region: process.env.AWS_REGION
});

/* -------------------- MULTER CONFIG -------------------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/* -------------------- ROUTES -------------------- */

// Health check
app.get('/', (req, res) => {
  res.send("Backend is up and  running ✅");
});

// Add user with image upload
app.post('/add-user', upload.single('image'), (req, res) => {
  const { name, email } = req.body;
  const file = req.file;

  if (!name || !email || !file) {
    return res.status(400).json({ message: "Name, email and image are required" });
  }

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: `users/${Date.now()}_${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error("❌ S3 upload error:", err);
      return res.status(500).json({ message: "S3 upload failed" });
    }

    const imageUrl = data.Location;

    const sql = "INSERT INTO users (name, email, image) VALUES (?, ?, ?)";
    db.query(sql, [name, email, imageUrl], (err, result) => {
      if (err) {
        console.error("❌ DB insert error:", err);
        return res.status(500).json({ message: "Database insert failed" });
      }

      res.json({
        message: "✅ User added successfully",
        data: { name, email, imageUrl }
      });
    });
  });
});

// Get all users
app.get('/users', (req, res) => {
  const sql = "SELECT * FROM users";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ DB fetch error:", err);
      return res.status(500).json({ message: "Database fetch failed" });
    }
    res.json(result);
  });
});

/* -------------------- SERVER -------------------- */
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
