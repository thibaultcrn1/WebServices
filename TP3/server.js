const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const { createServer } = require("http");
const { Server } = require("socket.io");
const z = require("zod");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const port = 8000;
const client = new MongoClient("mongodb://localhost:27017");
let db;

app.use(express.json());
app.use(express.static("public"));

// ─── Schémas Zod ─────────────────────────────────────────────────────────────

const CategorySchema = z.object({
  _id: z.string(),
  name: z.string().min(1),
});
const CreateCategorySchema = CategorySchema.omit({ _id: true });
const PatchCategorySchema = CreateCategorySchema.partial();

const ProductSchema = z.object({
  _id: z.string(),
  name: z.string().min(1),
  about: z.string().min(1),
  price: z.number().positive(),
  categoryIds: z.array(z.string()),
});
const CreateProductSchema = ProductSchema.omit({ _id: true });
const PatchProductSchema = CreateProductSchema.partial();

// ─── Helper ObjectId ──────────────────────────────────────────────────────────

function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═════════════════════════════════════════════════════════════════════════════

app.post("/categories", async (req, res) => {
  const result = CreateCategorySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { name } = result.data;
  const ack = await db.collection("categories").insertOne({ name });
  res.status(201).json({ _id: ack.insertedId, name });
});

app.get("/categories", async (_req, res) => {
  const categories = await db.collection("categories").find().toArray();
  res.json(categories);
});

app.get("/categories/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ message: "ID invalide" });

  const category = await db.collection("categories").findOne({ _id });
  if (!category) return res.status(404).json({ message: "Not found" });
  res.json(category);
});

app.put("/categories/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ message: "ID invalide" });

  const result = CreateCategorySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { name } = result.data;
  const ack = await db.collection("categories").findOneAndUpdate(
    { _id },
    { $set: { name } },
    { returnDocument: "after" }
  );
  if (!ack) return res.status(404).json({ message: "Not found" });
  res.json(ack);
});

app.patch("/categories/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ message: "ID invalide" });

  const result = PatchCategorySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const ack = await db.collection("categories").findOneAndUpdate(
    { _id },
    { $set: result.data },
    { returnDocument: "after" }
  );
  if (!ack) return res.status(404).json({ message: "Not found" });
  res.json(ack);
});

app.delete("/categories/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ message: "ID invalide" });

  const ack = await db.collection("categories").findOneAndDelete({ _id });
  if (!ack) return res.status(404).json({ message: "Not found" });
  res.json(ack);
});

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═════════════════════════════════════════════════════════════════════════════

app.post("/products", async (req, res) => {
  const result = CreateProductSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { name, about, price, categoryIds } = result.data;
  const categoryObjectIds = categoryIds.map((id) => new ObjectId(id));

  const ack = await db
    .collection("products")
    .insertOne({ name, about, price, categoryIds: categoryObjectIds });

  const product = { _id: ack.insertedId, name, about, price, categoryIds: categoryObjectIds };

  io.emit("product:created", product);
  res.status(201).json(product);
});

app.get("/products", async (_req, res) => {
  const products = await db
    .collection("products")
    .aggregate([
      { $match: {} },
      {
        $lookup: {
          from: "categories",
          localField: "categoryIds",
          foreignField: "_id",
          as: "categories",
        },
      },
    ])
    .toArray();
  res.json(products);
});

app.get("/products/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ message: "ID invalide" });

  const products = await db
    .collection("products")
    .aggregate([
      { $match: { _id } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryIds",
          foreignField: "_id",
          as: "categories",
        },
      },
    ])
    .toArray();

  if (products.length === 0) return res.status(404).json({ message: "Not found" });
  res.json(products[0]);
});

app.put("/products/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ message: "ID invalide" });

  const result = CreateProductSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { name, about, price, categoryIds } = result.data;
  const categoryObjectIds = categoryIds.map((id) => new ObjectId(id));

  const ack = await db.collection("products").findOneAndUpdate(
    { _id },
    { $set: { name, about, price, categoryIds: categoryObjectIds } },
    { returnDocument: "after" }
  );
  if (!ack) return res.status(404).json({ message: "Not found" });

  io.emit("product:updated", ack);
  res.json(ack);
});

app.patch("/products/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ message: "ID invalide" });

  const result = PatchProductSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const updateData = { ...result.data };
  if (updateData.categoryIds) {
    updateData.categoryIds = updateData.categoryIds.map((id) => new ObjectId(id));
  }

  const ack = await db.collection("products").findOneAndUpdate(
    { _id },
    { $set: updateData },
    { returnDocument: "after" }
  );
  if (!ack) return res.status(404).json({ message: "Not found" });

  io.emit("product:updated", ack);
  res.json(ack);
});

app.delete("/products/:id", async (req, res) => {
  const _id = toObjectId(req.params.id);
  if (!_id) return res.status(400).json({ message: "ID invalide" });

  const ack = await db.collection("products").findOneAndDelete({ _id });
  if (!ack) return res.status(404).json({ message: "Not found" });

  io.emit("product:deleted", { _id });
  res.json(ack);
});

// ═════════════════════════════════════════════════════════════════════════════
// SOCKET.IO
// ═════════════════════════════════════════════════════════════════════════════

io.on("connection", (socket) => {
  console.log("Client connecté :", socket.id);
  socket.on("disconnect", () => console.log("Client déconnecté :", socket.id));
});

// ─────────────────────────────────────────────────────────────────────────────

client.connect().then(() => {
  db = client.db("myDB");
  httpServer.listen(port, () => {
    console.log(`MythicGames NoSQL API running at http://localhost:${port}`);
    console.log(`Frontend Socket.io : http://localhost:${port}/index.html`);
  });
});
