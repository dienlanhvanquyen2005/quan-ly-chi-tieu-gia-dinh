const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "transactions.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

function readData() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function writeData(data) {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE);
}

app.get("/api/transactions", (req, res) => res.json(readData()));

app.post("/api/transactions", (req, res) => {
  const { type, date, name, amount, category, note } = req.body || {};
  if (!["income", "expense"].includes(type) || !date || !name || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Dữ liệu giao dịch không hợp lệ." });
  }
  const item = {
    id: crypto.randomUUID(),
    type,
    date,
    name: String(name).trim(),
    amount: Number(amount),
    category: String(category || (type === "income" ? "Thu nhập" : "Khác")),
    note: String(note || "").trim(),
    createdAt: new Date().toISOString()
  };
  const data = readData();
  data.push(item);
  writeData(data);
  res.status(201).json(item);
});

app.delete("/api/transactions/:id", (req, res) => {
  const data = readData();
  const next = data.filter(x => x.id !== req.params.id);
  if (next.length === data.length) return res.status(404).json({ error: "Không tìm thấy giao dịch." });
  writeData(next);
  res.json({ ok: true });
});

app.post("/api/backup/restore", (req, res) => {
  const incoming = req.body?.transactions;
  if (!Array.isArray(incoming)) return res.status(400).json({ error: "Dữ liệu sao lưu không hợp lệ." });
  writeData(incoming);
  res.json({ ok: true, count: incoming.length });
});

app.get("*splat", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Website chạy tại http://localhost:${PORT}`));