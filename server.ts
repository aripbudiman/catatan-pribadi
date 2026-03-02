import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;
let isMongo = false;
let db: any = null;

// MongoDB Schema
const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'General' },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    transform: (doc, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const ArticleModel = mongoose.model("Article", articleSchema);

async function initDB() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      console.log("Connected to MongoDB");
      isMongo = true;
      
      const count = await ArticleModel.countDocuments();
      if (count === 0) {
        await ArticleModel.create([
          { title: "Getting Started with React", content: "# Welcome to React\n\nReact is a library for building user interfaces.\n\n```javascript\nfunction Hello() {\n  return <h1>Hello World</h1>;\n}\n```", category: "React" },
          { title: "TypeScript Basics", content: "# TypeScript\n\nTypeScript adds static typing to JavaScript.\n\n```typescript\ninterface User {\n  id: number;\n  name: string;\n}\n\nconst user: User = { id: 1, name: 'Arif' };\n```", category: "TypeScript" }
        ]);
      }
      return;
    } catch (err) {
      console.error("MongoDB connection failed, falling back to SQLite:", err);
    }
  }

  console.log("Using SQLite as database");
  db = new Database("articles.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  const count = db.prepare("SELECT COUNT(*) as count FROM articles").get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare("INSERT INTO articles (title, content, category) VALUES (?, ?, ?)");
    insert.run("Getting Started with React", "# Welcome to React\n\nReact is a library for building user interfaces.\n\n```javascript\nfunction Hello() {\n  return <h1>Hello World</h1>;\n}\n```", "React");
    insert.run("TypeScript Basics", "# TypeScript\n\nTypeScript adds static typing to JavaScript.\n\n```typescript\ninterface User {\n  id: number;\n  name: string;\n}\n\nconst user: User = { id: 1, name: 'Arif' };\n```", "TypeScript");
  }
}

async function startServer() {
  await initDB();

  const app = express();
  app.use(express.json());

  app.get("/api/status", (req, res) => {
    res.json({ 
      database: isMongo ? "connected" : "sqlite",
      type: isMongo ? "mongodb" : "sqlite",
      uri: MONGODB_URI ? MONGODB_URI.replace(/:([^:@]{1,})@/, ":****@") : "local"
    });
  });

  app.get("/api/articles", async (req, res) => {
    try {
      if (isMongo) {
        const articles = await ArticleModel.find().sort({ updated_at: -1 });
        res.json(articles);
      } else {
        const articles = db.prepare("SELECT * FROM articles ORDER BY updated_at DESC").all();
        res.json(articles);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      if (isMongo) {
        const article = await ArticleModel.findById(req.params.id);
        res.json(article);
      } else {
        const article = db.prepare("SELECT * FROM articles WHERE id = ?").get(req.params.id);
        res.json(article);
      }
    } catch (err: any) {
      res.status(400).json({ error: "Article not found" });
    }
  });

  app.post("/api/articles", async (req, res) => {
    try {
      const { title, content, category } = req.body;
      if (isMongo) {
        const newArticle = await ArticleModel.create({ title, content, category: category || 'General' });
        res.status(201).json(newArticle);
      } else {
        const info = db.prepare("INSERT INTO articles (title, content, category) VALUES (?, ?, ?)").run(title, content, category || 'General');
        const newArticle = db.prepare("SELECT * FROM articles WHERE id = ?").get(info.lastInsertRowid);
        res.status(201).json(newArticle);
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/articles/:id", async (req, res) => {
    try {
      const { title, content, category } = req.body;
      if (isMongo) {
        const updated = await ArticleModel.findByIdAndUpdate(req.params.id, { title, content, category }, { new: true });
        res.json(updated);
      } else {
        db.prepare("UPDATE articles SET title = ?, content = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(title, content, category, req.params.id);
        const updated = db.prepare("SELECT * FROM articles WHERE id = ?").get(req.params.id);
        res.json(updated);
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/articles/:id", async (req, res) => {
    try {
      if (isMongo) {
        await ArticleModel.findByIdAndDelete(req.params.id);
      } else {
        db.prepare("DELETE FROM articles WHERE id = ?").run(req.params.id);
      }
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(3000, "0.0.0.0", () => console.log(`Server running on http://localhost:3000`));
}

startServer();
