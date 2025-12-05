// Vercel serverless function: Products API with filtering + pagination.
import fs from "fs/promises";
import path from "path";

let cache = null;
async function loadData() {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "products.json");
  const raw = await fs.readFile(file, "utf-8");
  cache = JSON.parse(raw);
  return cache;
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = await loadData();
    const { category, q, page = "1", limit = "24" } = req.query;

    let items = data.products.slice();

    if (category) {
      const c = String(category).toLowerCase();
      items = items.filter(p => p.category.toLowerCase() === c);
    }

    if (q) {
      const s = String(q).toLowerCase();
      items = items.filter(p =>
        p.name.toLowerCase().includes(s) ||
        (p.description || "").toLowerCase().includes(s)
      );
    }

    // pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 24));
    const start = (pageNum - 1) * lim;
    const end = start + lim;

    const total = items.length;
    const paged = items.slice(start, end);

    res.status(200).json({
      storeId: "metro",
      storeName: "Metro",
      total,
      page: pageNum,
      limit: lim,
      items: paged
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load products" });
  }
}
