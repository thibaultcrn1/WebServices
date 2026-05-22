const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const z = require("zod");

const app = express();
const port = 8001;
const client = new MongoClient("mongodb://localhost:27017");
let db;

app.use(express.json());

// ─── Schémas Zod ──────────────────────────────────────────────────────────────

const ViewSchema = z.object({
  visitorId: z.string(),
  url: z.string(),
  meta: z.record(z.unknown()).optional().default({}),
});

const ActionSchema = z.object({
  visitorId: z.string(),
  type: z.string(),
  meta: z.record(z.unknown()).optional().default({}),
});

const GoalSchema = z.object({
  visitorId: z.string(),
  name: z.string(),
  meta: z.record(z.unknown()).optional().default({}),
});

// ─── Helper ObjectId ──────────────────────────────────────────────────────────

function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEWS
// ═════════════════════════════════════════════════════════════════════════════

app.post("/views", async (req, res) => {
  const result = ViewSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const doc = { ...result.data, createdAt: new Date() };
  const ack = await db.collection("views").insertOne(doc);
  res.status(201).json({ _id: ack.insertedId, ...doc });
});

app.get("/views", async (_req, res) => {
  const views = await db.collection("views").find().sort({ createdAt: -1 }).toArray();
  res.json(views);
});

// ═════════════════════════════════════════════════════════════════════════════
// ACTIONS
// ═════════════════════════════════════════════════════════════════════════════

app.post("/actions", async (req, res) => {
  const result = ActionSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const doc = { ...result.data, createdAt: new Date() };
  const ack = await db.collection("actions").insertOne(doc);
  res.status(201).json({ _id: ack.insertedId, ...doc });
});

app.get("/actions", async (_req, res) => {
  const actions = await db.collection("actions").find().sort({ createdAt: -1 }).toArray();
  res.json(actions);
});

// ═════════════════════════════════════════════════════════════════════════════
// GOALS
// ═════════════════════════════════════════════════════════════════════════════

app.post("/goals", async (req, res) => {
  const result = GoalSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const doc = { ...result.data, createdAt: new Date() };
  const ack = await db.collection("goals").insertOne(doc);
  res.status(201).json({ _id: ack.insertedId, ...doc });
});

app.get("/goals", async (_req, res) => {
  const goals = await db.collection("goals").find().sort({ createdAt: -1 }).toArray();
  res.json(goals);
});

// Agrégation : goal + toutes les views et actions du même visiteur
app.get("/goals/:goalId/details", async (req, res) => {
  const _id = toObjectId(req.params.goalId);
  if (!_id) return res.status(400).json({ message: "ID invalide" });

  const result = await db
    .collection("goals")
    .aggregate([
      { $match: { _id } },
      {
        $lookup: {
          from: "views",
          localField: "visitorId",
          foreignField: "visitorId",
          as: "views",
        },
      },
      {
        $lookup: {
          from: "actions",
          localField: "visitorId",
          foreignField: "visitorId",
          as: "actions",
        },
      },
    ])
    .toArray();

  if (result.length === 0) return res.status(404).json({ message: "Goal introuvable" });
  res.json(result[0]);
});

// ─────────────────────────────────────────────────────────────────────────────

client.connect().then(() => {
  db = client.db("analyticsDB");
  app.listen(port, () => {
    console.log(`REST-ANALYTICS running at http://localhost:${port}`);
  });
});
