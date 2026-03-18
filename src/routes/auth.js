const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const [exists] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (exists.length > 0)
      return res.status(400).json({ success: false, message: "Email đã tồn tại!" });

    const hashed = await bcrypt.hash(password, 10);
    await db.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed]
    );
    res.json({ success: true, message: "Đăng ký thành công!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log("=== LOGIN REQUEST ===");
    console.log("BODY:", req.body);
    const { email, password } = req.body;
    console.log("EMAIL:", email, "| PASS:", password);

    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0)
      return res.status(400).json({ success: false, message: "Email không tồn tại!" });

    const valid = await bcrypt.compare(password, users[0].password);
    if (!valid)
      return res.status(400).json({ success: false, message: "Mật khẩu không đúng!" });

    const token = jwt.sign(
      { id: users[0].id, name: users[0].name, email: users[0].email, role: users[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      success: true, token,
      user: { id: users[0].id, name: users[0].name, email: users[0].email, role: users[0].role }
    });
  } catch (err) {
    console.log("ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;