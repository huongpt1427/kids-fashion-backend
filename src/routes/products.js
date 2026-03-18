const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT p.*, GROUP_CONCAT(ps.size ORDER BY ps.id) as sizes
      FROM products p
      LEFT JOIN product_sizes ps ON p.id = ps.product_id
    `;
    const params = [];
    const conditions = [];

    if (category) { conditions.push("p.category = ?"); params.push(category); }
    if (search) { conditions.push("p.name LIKE ?"); params.push(`%${search}%`); }
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " GROUP BY p.id ORDER BY p.id";

    const [rows] = await db.execute(query, params);
    const products = rows.map(p => ({
      ...p,
      sizes: p.sizes ? p.sizes.split(",") : [],
    }));
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, GROUP_CONCAT(ps.size ORDER BY ps.id) as sizes
      FROM products p
      LEFT JOIN product_sizes ps ON p.id = ps.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [req.params.id]);

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Không tìm thấy!" });

    const product = { ...rows[0], sizes: rows[0].sizes ? rows[0].sizes.split(",") : [] };
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
// PUT /api/products/:id
router.put("/:id", async (req, res) => {
  const { name, price, original_price, cost_price, image, category, description, sizes } = req.body;
  try {
    await pool.query(
      `UPDATE products SET name=?, price=?, original_price=?, cost_price=?,
       image=?, category=?, description=? WHERE id=?`,
      [name, price, original_price, cost_price, image, category, description, req.params.id]
    );
    if (sizes?.length) {
      await pool.query("DELETE FROM product_sizes WHERE product_id=?", [req.params.id]);
      for (const s of sizes) {
        await pool.query(
          "INSERT INTO product_sizes (product_id, size, stock) VALUES (?,?,?)",
          [req.params.id, s.size, s.stock]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products
router.post("/", async (req, res) => {
  const { name, price, original_price, cost_price, image, category, description, sizes } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO products (name, price, original_price, cost_price, image, category, description)
       VALUES (?,?,?,?,?,?,?)`,
      [name, price, original_price, cost_price, image, category, description]
    );
    const productId = result.insertId;
    if (sizes?.length) {
      for (const s of sizes) {
        await pool.query(
          "INSERT INTO product_sizes (product_id, size, stock) VALUES (?,?,?)",
          [productId, s.size, s.stock]
        );
      }
    }
    res.json({ success: true, id: productId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM product_sizes WHERE product_id=?", [req.params.id]);
    await pool.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});