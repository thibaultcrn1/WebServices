const express = require("express");
const postgres = require("postgres");
const z = require("zod");
const bcrypt = require("bcrypt");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const app = express();
const port = 8000;
const sql = postgres({ db: "mydb", user: "user", password: "password" });

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ─── Schémas Zod ─────────────────────────────────────────────────────────────

const ProductSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  about: z.string().min(1),
  price: z.number().positive(),
});
const CreateProductSchema = ProductSchema.omit({ id: true });
const PatchProductSchema = CreateProductSchema.partial();

const UserSchema = z.object({
  id: z.number(),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});
const CreateUserSchema = UserSchema.omit({ id: true });
const PatchUserSchema = CreateUserSchema.partial();

const OrderSchema = z.object({
  user_id: z.number().int().positive(),
  product_ids: z.array(z.number().int().positive()).min(1),
  payment: z.boolean().optional().default(false),
});
const PatchOrderSchema = OrderSchema.partial();

const ReviewSchema = z.object({
  user_id: z.number().int().positive(),
  product_id: z.number().int().positive(),
  score: z.number().int().min(1).max(5),
  content: z.string().min(1),
});
const PatchReviewSchema = ReviewSchema.partial();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function omitPassword(user) {
  const { password, ...rest } = user;
  return rest;
}

async function recalcProductScore(productId) {
  const result = await sql`
    SELECT COALESCE(AVG(score), 0) AS avg
    FROM reviews
    WHERE product_id = ${productId}
  `;
  await sql`
    UPDATE products SET avg_score = ${result[0].avg} WHERE id = ${productId}
  `;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.send("MythicGames API - REST + PostgreSQL");
});

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═════════════════════════════════════════════════════════════════════════════

app.post("/products", async (req, res) => {
  const result = CreateProductSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { name, about, price } = result.data;
  const product = await sql`
    INSERT INTO products (name, about, price)
    VALUES (${name}, ${about}, ${price})
    RETURNING *
  `;
  res.status(201).json(product[0]);
});

// Recherche par paramètres : /products?name=&about=&price=
app.get("/products", async (req, res) => {
  const { name, about, price } = req.query;

  const products = await sql`
    SELECT * FROM products
    WHERE
      (${name  ?? null}::text IS NULL OR name  ILIKE ${"%" + name  + "%"})
      AND
      (${about ?? null}::text IS NULL OR about ILIKE ${"%" + about + "%"})
      AND
      (${price ?? null}::text IS NULL OR price = ${parseFloat(price)})
  `;
  res.json(products);
});

app.get("/products/:id", async (req, res) => {
  const product = await sql`
    SELECT * FROM products WHERE id = ${req.params.id}
  `;
  if (product.length === 0) return res.status(404).json({ message: "Not found" });
  res.json(product[0]);
});

app.put("/products/:id", async (req, res) => {
  const result = CreateProductSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { name, about, price } = result.data;
  const product = await sql`
    UPDATE products
    SET name = ${name}, about = ${about}, price = ${price}, updated_at = NOW()
    WHERE id = ${req.params.id}
    RETURNING *
  `;
  if (product.length === 0) return res.status(404).json({ message: "Not found" });
  res.json(product[0]);
});

app.patch("/products/:id", async (req, res) => {
  const result = PatchProductSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const existing = await sql`SELECT * FROM products WHERE id = ${req.params.id}`;
  if (existing.length === 0) return res.status(404).json({ message: "Not found" });

  const current = existing[0];
  const { name, about, price } = result.data;
  const product = await sql`
    UPDATE products
    SET
      name  = ${name  ?? current.name},
      about = ${about ?? current.about},
      price = ${price ?? current.price},
      updated_at = NOW()
    WHERE id = ${req.params.id}
    RETURNING *
  `;
  res.json(product[0]);
});

app.delete("/products/:id", async (req, res) => {
  const product = await sql`
    DELETE FROM products WHERE id = ${req.params.id} RETURNING *
  `;
  if (product.length === 0) return res.status(404).json({ message: "Not found" });
  res.json(product[0]);
});

// ═════════════════════════════════════════════════════════════════════════════
// USERS (mot de passe hashé avec bcrypt, jamais renvoyé)
// ═════════════════════════════════════════════════════════════════════════════

app.post("/users", async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { username, email, password } = result.data;
  const hash = await bcrypt.hash(password, 10);

  const user = await sql`
    INSERT INTO users (username, email, password)
    VALUES (${username}, ${email}, ${hash})
    RETURNING *
  `;
  res.status(201).json(omitPassword(user[0]));
});

app.get("/users", async (_req, res) => {
  const users = await sql`SELECT id, username, email, created_at, updated_at FROM users`;
  res.json(users);
});

app.get("/users/:id", async (req, res) => {
  const user = await sql`
    SELECT id, username, email, created_at, updated_at FROM users WHERE id = ${req.params.id}
  `;
  if (user.length === 0) return res.status(404).json({ message: "Not found" });
  res.json(user[0]);
});

app.put("/users/:id", async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { username, email, password } = result.data;
  const hash = await bcrypt.hash(password, 10);

  const user = await sql`
    UPDATE users
    SET username = ${username}, email = ${email}, password = ${hash}, updated_at = NOW()
    WHERE id = ${req.params.id}
    RETURNING *
  `;
  if (user.length === 0) return res.status(404).json({ message: "Not found" });
  res.json(omitPassword(user[0]));
});

app.patch("/users/:id", async (req, res) => {
  const result = PatchUserSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const existing = await sql`SELECT * FROM users WHERE id = ${req.params.id}`;
  if (existing.length === 0) return res.status(404).json({ message: "Not found" });

  const current = existing[0];
  const { username, email, password } = result.data;
  const hash = password ? await bcrypt.hash(password, 10) : current.password;

  const user = await sql`
    UPDATE users
    SET
      username = ${username ?? current.username},
      email    = ${email    ?? current.email},
      password = ${hash},
      updated_at = NOW()
    WHERE id = ${req.params.id}
    RETURNING *
  `;
  res.json(omitPassword(user[0]));
});

app.delete("/users/:id", async (req, res) => {
  const user = await sql`DELETE FROM users WHERE id = ${req.params.id} RETURNING *`;
  if (user.length === 0) return res.status(404).json({ message: "Not found" });
  res.json(omitPassword(user[0]));
});

// ═════════════════════════════════════════════════════════════════════════════
// F2P-GAMES (service externe FreeToGame)
// ═════════════════════════════════════════════════════════════════════════════

app.get("/f2p-games", async (_req, res) => {
  const response = await fetch("https://www.freetogame.com/api/games");
  if (!response.ok) return res.status(502).json({ message: "Service externe indisponible" });
  const games = await response.json();
  res.json(games);
});

app.get("/f2p-games/:id", async (req, res) => {
  const response = await fetch(`https://www.freetogame.com/api/game?id=${req.params.id}`);
  if (!response.ok) return res.status(404).json({ message: "Jeu introuvable" });
  const game = await response.json();
  res.json(game);
});

// ═════════════════════════════════════════════════════════════════════════════
// ORDERS (panier)
// ═════════════════════════════════════════════════════════════════════════════

app.post("/orders", async (req, res) => {
  const result = OrderSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { user_id, product_ids, payment } = result.data;

  // Vérifier que l'utilisateur existe
  const user = await sql`SELECT id FROM users WHERE id = ${user_id}`;
  if (user.length === 0) return res.status(404).json({ message: "Utilisateur introuvable" });

  // Récupérer les prix pour calculer le total HT puis avec TVA (×1.2)
  const products = await sql`SELECT id, price FROM products WHERE id = ANY(${product_ids})`;
  if (products.length !== product_ids.length) {
    return res.status(404).json({ message: "Un ou plusieurs produits introuvables" });
  }
  const totalHT = products.reduce((sum, p) => sum + p.price, 0);
  const total = parseFloat((totalHT * 1.2).toFixed(2));

  const order = await sql`
    INSERT INTO orders (user_id, total, payment)
    VALUES (${user_id}, ${total}, ${payment})
    RETURNING *
  `;
  const orderId = order[0].id;

  await sql`
    INSERT INTO order_products (order_id, product_id)
    SELECT ${orderId}, UNNEST(${product_ids}::int[])
  `;

  res.status(201).json({ ...order[0], product_ids });
});

app.get("/orders", async (_req, res) => {
  const orders = await sql`
    SELECT o.*, ARRAY_AGG(op.product_id) AS product_ids
    FROM orders o
    LEFT JOIN order_products op ON o.id = op.order_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;
  res.json(orders);
});

app.get("/orders/:id", async (req, res) => {
  const order = await sql`
    SELECT o.*, ARRAY_AGG(op.product_id) AS product_ids
    FROM orders o
    LEFT JOIN order_products op ON o.id = op.order_id
    WHERE o.id = ${req.params.id}
    GROUP BY o.id
  `;
  if (order.length === 0) return res.status(404).json({ message: "Not found" });
  res.json(order[0]);
});

app.put("/orders/:id", async (req, res) => {
  const result = OrderSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { user_id, product_ids, payment } = result.data;

  const products = await sql`SELECT id, price FROM products WHERE id = ANY(${product_ids})`;
  if (products.length !== product_ids.length) {
    return res.status(404).json({ message: "Un ou plusieurs produits introuvables" });
  }
  const total = parseFloat((products.reduce((sum, p) => sum + p.price, 0) * 1.2).toFixed(2));

  const order = await sql`
    UPDATE orders
    SET user_id = ${user_id}, total = ${total}, payment = ${payment}, updated_at = NOW()
    WHERE id = ${req.params.id}
    RETURNING *
  `;
  if (order.length === 0) return res.status(404).json({ message: "Not found" });

  await sql`DELETE FROM order_products WHERE order_id = ${req.params.id}`;
  await sql`
    INSERT INTO order_products (order_id, product_id)
    SELECT ${parseInt(req.params.id)}, UNNEST(${product_ids}::int[])
  `;

  res.json({ ...order[0], product_ids });
});

app.patch("/orders/:id", async (req, res) => {
  const result = PatchOrderSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const existing = await sql`
    SELECT o.*, ARRAY_AGG(op.product_id) AS product_ids
    FROM orders o
    LEFT JOIN order_products op ON o.id = op.order_id
    WHERE o.id = ${req.params.id}
    GROUP BY o.id
  `;
  if (existing.length === 0) return res.status(404).json({ message: "Not found" });

  const current = existing[0];
  const { user_id, product_ids, payment } = result.data;

  const newProductIds = product_ids ?? current.product_ids;
  const products = await sql`SELECT id, price FROM products WHERE id = ANY(${newProductIds})`;
  const total = parseFloat((products.reduce((sum, p) => sum + p.price, 0) * 1.2).toFixed(2));

  const order = await sql`
    UPDATE orders
    SET
      user_id  = ${user_id  ?? current.user_id},
      total    = ${total},
      payment  = ${payment  ?? current.payment},
      updated_at = NOW()
    WHERE id = ${req.params.id}
    RETURNING *
  `;

  if (product_ids) {
    await sql`DELETE FROM order_products WHERE order_id = ${req.params.id}`;
    await sql`
      INSERT INTO order_products (order_id, product_id)
      SELECT ${parseInt(req.params.id)}, UNNEST(${newProductIds}::int[])
    `;
  }

  res.json({ ...order[0], product_ids: newProductIds });
});

app.delete("/orders/:id", async (req, res) => {
  const order = await sql`DELETE FROM orders WHERE id = ${req.params.id} RETURNING *`;
  if (order.length === 0) return res.status(404).json({ message: "Not found" });
  res.json(order[0]);
});

// ═════════════════════════════════════════════════════════════════════════════
// REVIEWS (avis)
// ═════════════════════════════════════════════════════════════════════════════

app.post("/reviews", async (req, res) => {
  const result = ReviewSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { user_id, product_id, score, content } = result.data;

  const review = await sql`
    INSERT INTO reviews (user_id, product_id, score, content)
    VALUES (${user_id}, ${product_id}, ${score}, ${content})
    RETURNING *
  `;
  await recalcProductScore(product_id);

  res.status(201).json(review[0]);
});

app.get("/reviews", async (_req, res) => {
  const reviews = await sql`SELECT * FROM reviews ORDER BY created_at DESC`;
  res.json(reviews);
});

app.get("/reviews/:id", async (req, res) => {
  const review = await sql`SELECT * FROM reviews WHERE id = ${req.params.id}`;
  if (review.length === 0) return res.status(404).json({ message: "Not found" });
  res.json(review[0]);
});

app.put("/reviews/:id", async (req, res) => {
  const result = ReviewSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { user_id, product_id, score, content } = result.data;
  const review = await sql`
    UPDATE reviews
    SET user_id = ${user_id}, product_id = ${product_id}, score = ${score}, content = ${content}, updated_at = NOW()
    WHERE id = ${req.params.id}
    RETURNING *
  `;
  if (review.length === 0) return res.status(404).json({ message: "Not found" });
  await recalcProductScore(product_id);
  res.json(review[0]);
});

app.patch("/reviews/:id", async (req, res) => {
  const result = PatchReviewSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const existing = await sql`SELECT * FROM reviews WHERE id = ${req.params.id}`;
  if (existing.length === 0) return res.status(404).json({ message: "Not found" });

  const current = existing[0];
  const { user_id, product_id, score, content } = result.data;
  const review = await sql`
    UPDATE reviews
    SET
      user_id    = ${user_id    ?? current.user_id},
      product_id = ${product_id ?? current.product_id},
      score      = ${score      ?? current.score},
      content    = ${content    ?? current.content},
      updated_at = NOW()
    WHERE id = ${req.params.id}
    RETURNING *
  `;
  await recalcProductScore(review[0].product_id);
  res.json(review[0]);
});

app.delete("/reviews/:id", async (req, res) => {
  const review = await sql`DELETE FROM reviews WHERE id = ${req.params.id} RETURNING *`;
  if (review.length === 0) return res.status(404).json({ message: "Not found" });
  await recalcProductScore(review[0].product_id);
  res.json(review[0]);
});

// ─────────────────────────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`MythicGames REST API running at http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api-docs`);
});
