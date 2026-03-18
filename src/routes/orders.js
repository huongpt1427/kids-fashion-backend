const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Tạo đơn hàng → tự động trừ tồn kho
router.post("/", async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { user_name, phone, address, total, discount = 0, payment_method = 'cod', note = '', items } = req.body;
    const final_total = total - discount;

    // Kiểm tra tồn kho trước
    for (const item of items) {
      const [stock] = await conn.execute(
        "SELECT stock FROM product_sizes WHERE product_id = ? AND size = ?",
        [item.id, item.size]
      );
      if (stock.length === 0 || stock[0].stock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.name}" size ${item.size} không đủ hàng!`
        });
      }
    }

    // Tạo đơn hàng
    const [result] = await conn.execute(
      `INSERT INTO orders 
       (user_name, phone, address, total, discount, final_total, payment_method, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_name, phone, address, total, discount, final_total, payment_method, note]
    );
    const orderId = result.insertId;

    // Thêm chi tiết đơn + trừ tồn kho
    for (const item of items) {
      await conn.execute(
        "INSERT INTO order_items (order_id, product_id, size, quantity, price) VALUES (?, ?, ?, ?, ?)",
        [orderId, item.id, item.size, item.quantity, item.price]
      );

      // Trừ tồn kho
      await conn.execute(
        "UPDATE product_sizes SET stock = stock - ? WHERE product_id = ? AND size = ?",
        [item.quantity, item.id, item.size]
      );

      // Tăng số lượng đã bán
      await conn.execute(
        "UPDATE products SET sold = sold + ? WHERE id = ?",
        [item.quantity, item.id]
      );
    }

    await conn.commit();
    res.json({ success: true, message: "Đặt hàng thành công!", orderId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// GET tất cả đơn hàng
router.get("/", async (req, res) => {
  try {
    const [orders] = await db.execute(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET chi tiết đơn hàng
router.get("/:id", async (req, res) => {
  try {
    const [order] = await db.execute(
      "SELECT * FROM orders WHERE id = ?", [req.params.id]
    );
    if (order.length === 0)
      return res.status(404).json({ success: false, message: "Không tìm thấy!" });

    const [items] = await db.execute(`
      SELECT oi.*, p.name, p.image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [req.params.id]);

    res.json({ success: true, data: { ...order[0], items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cập nhật trạng thái đơn hàng
router.put("/:id/status", async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { status } = req.body;

    // Nếu hủy đơn → hoàn lại tồn kho
    if (status === 'cancelled') {
      const [items] = await conn.execute(
        "SELECT * FROM order_items WHERE order_id = ?", [req.params.id]
      );
      for (const item of items) {
        await conn.execute(
          "UPDATE product_sizes SET stock = stock + ? WHERE product_id = ? AND size = ?",
          [item.quantity, item.product_id, item.size]
        );
        await conn.execute(
          "UPDATE products SET sold = sold - ? WHERE id = ?",
          [item.quantity, item.product_id]
        );
      }
    }

    await conn.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    await conn.commit();
    res.json({ success: true, message: "Cập nhật trạng thái thành công!" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;