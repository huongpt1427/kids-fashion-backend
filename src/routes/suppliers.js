const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM suppliers ORDER BY name");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, phone, email, address, contact_person, note } = req.body;
    const [result] = await db.execute(
      "INSERT INTO suppliers (name, phone, email, address, contact_person, note) VALUES (?, ?, ?, ?, ?, ?)",
      [name, phone, email, address, contact_person, note]
    );
    res.json({ success: true, message: "Thêm nhà cung cấp thành công!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, phone, email, address, contact_person, note } = req.body;
    await db.execute(
      "UPDATE suppliers SET name=?, phone=?, email=?, address=?, contact_person=?, note=? WHERE id=?",
      [name, phone, email, address, contact_person, note, req.params.id]
    );
    res.json({ success: true, message: "Cập nhật thành công!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.execute("DELETE FROM suppliers WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Đã xóa!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;