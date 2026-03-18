const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Tạo phiếu nhập hàng
router.post("/", async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { supplier_id, staff_name, note, items } = req.body;

    const total_amount = items.reduce((sum, i) => sum + i.quantity * i.cost_price, 0);

    const [result] = await conn.execute(
      "INSERT INTO imports (supplier_id, staff_name, total_amount, note) VALUES (?, ?, ?, ?)",
      [supplier_id, staff_name, total_amount, note]
    );
    const importId = result.insertId;

    for (const item of items) {
      await conn.execute(
        "INSERT INTO import_items (import_id, product_id, size, quantity, cost_price) VALUES (?, ?, ?, ?, ?)",
        [importId, item.product_id, item.size, item.quantity, item.cost_price]
      );

      // Tăng tồn kho
      await conn.execute(
        "UPDATE product_sizes SET stock = stock + ? WHERE product_id = ? AND size = ?",
        [item.quantity, item.product_id, item.size]
      );

      // Cập nhật giá nhập mới nhất
      await conn.execute(
        "UPDATE products SET cost_price = ? WHERE id = ?",
        [item.cost_price, item.product_id]
      );
    }

    await conn.commit();
    res.json({ success: true, message: "Nhập hàng thành công!", importId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// GET tất cả phiếu nhập
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT i.*, s.name as supplier_name
      FROM imports i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      ORDER BY i.import_date DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET chi tiết phiếu nhập
router.get("/:id", async (req, res) => {
  try {
    const [imp] = await db.execute(`
      SELECT i.*, s.name as supplier_name
      FROM imports i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.id = ?
    `, [req.params.id]);

    const [items] = await db.execute(`
      SELECT ii.*, p.name as product_name
      FROM import_items ii
      JOIN products p ON ii.product_id = p.id
      WHERE ii.import_id = ?
    `, [req.params.id]);

    res.json({ success: true, data: { ...imp[0], items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;