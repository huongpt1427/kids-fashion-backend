const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/products",   require("./src/routes/products"));
app.use("/api/auth",       require("./src/routes/auth"));
app.use("/api/orders",     require("./src/routes/orders"));
app.use("/api/customers",  require("./src/routes/customers"));
app.use("/api/imports",    require("./src/routes/imports"));
app.use("/api/suppliers",  require("./src/routes/suppliers"));

app.get("/", (req, res) => {
  res.json({ message: "✅ KidsFashion API đang chạy!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});