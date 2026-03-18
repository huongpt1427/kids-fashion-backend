const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET tất cả khách hàng
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM customers ORDER BY created_at DESC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET chi tiết khách hàng
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM customers WHERE id = ?", [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Không tìm thấy!" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST thêm khách hàng
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, address, gender, birthday } = req.body;
    const [result] = await db.execute(
      "INSERT INTO customers (name, phone, email, address, gender, birthday) VALUES (?, ?, ?, ?, ?, ?)",
      [name, phone, email, address, gender, birthday || null]
    );
    res.json({ success: true, message: "Thêm thành công!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT cập nhật khách hàng
router.put("/:id", async (req, res) => {
  try {
    const { name, phone, email, address, gender, birthday } = req.body;
    await db.execute(
      "UPDATE customers SET name=?, phone=?, email=?, address=?, gender=?, birthday=? WHERE id=?",
      [name, phone, email, address, gender, birthday || null, req.params.id]
    );
    res.json({ success: true, message: "Cập nhật thành công!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE xóa khách hàng
router.delete("/:id", async (req, res) => {
  try {
    await db.execute("DELETE FROM customers WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Đã xóa!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;