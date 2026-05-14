import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIREBASE_URL_BASE = "https://english-zone-2c406-default-rtdb.asia-southeast1.firebasedatabase.app/article";
const FIREBASE_SECRET = process.env.FIREBASE_DATABASE_SECRET;

const getFirebaseUrl = (path: string = ".json") => {
  const url = `${FIREBASE_URL_BASE}${path}`;
  return FIREBASE_SECRET ? `${url}?auth=${FIREBASE_SECRET}` : url;
};

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get("/api/status", (req, res) => {
    res.json({ 
      database: "connected",
      type: "firebase-rtdb",
      uri: FIREBASE_URL_BASE + ".json",
      auth_configured: !!FIREBASE_SECRET
    });
  });

  app.get("/api/articles", async (req, res) => {
    try {
      const url = getFirebaseUrl();
      console.log(`Fetching articles from: ${url.replace(FIREBASE_SECRET || 'NONE', '***')}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Firebase error ${response.status}: ${errorText}`);
        if (response.status === 401 || response.status === 403) {
          return res.status(response.status).json({ 
            error: "Permission Denied. Please ensure your Firebase Realtime Database rules are set to public, or provide a FIREBASE_DATABASE_SECRET in the Secrets panel.",
            details: errorText
          });
        }
        throw new Error(`Firebase returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data || Object.keys(data).length === 0) {
        console.log("Database is empty. Seeding initial data...");
        const initialData = {
          title: "Welcome to DevNotes",
          content: "# Welcome\n\nYour notes are now synced with Firebase Realtime Database!\n\nCheck your rules if you don't see any data.",
          category: "General",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const seedUrl = getFirebaseUrl();
        const seedResponse = await fetch(seedUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(initialData)
        });
        const seedResult = await seedResponse.json();
        return res.json([{ ...initialData, id: seedResult.name }]);
      }
      
      const articles = Object.keys(data).map(key => ({
        ...data[key],
        id: key
      })).sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(articles);
    } catch (err: any) {
      console.error("Fetch articles failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const url = getFirebaseUrl(`/${req.params.id}.json`);
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data) return res.status(404).json({ error: "Article not found" });
      
      res.json({ ...data, id: req.params.id });
    } catch (err: any) {
      res.status(400).json({ error: "Article not found" });
    }
  });

  app.post("/api/articles", async (req, res) => {
    try {
      const { title, content, category } = req.body;
      const now = new Date().toISOString();
      const articleData = {
        title,
        content,
        category: category || 'General',
        created_at: now,
        updated_at: now
      };

      const url = getFirebaseUrl();
      console.log(`Posting to Firebase...`);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData)
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Firebase Error ${response.status}`);
      }
      
      res.status(201).json({ ...articleData, id: result.name });
    } catch (err: any) {
      console.error("Create article failed:", err);
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/articles/:id", async (req, res) => {
    try {
      const { title, content, category } = req.body;
      const now = new Date().toISOString();
      
      const articleData = {
        title,
        content,
        category: category || 'General',
        updated_at: now
      };

      const url = getFirebaseUrl(`/${req.params.id}.json`);
      console.log(`Patching to Firebase...`);
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData)
      });
      
      const updated = await response.json();
      if (!response.ok) {
        throw new Error(updated.error || `Firebase Error ${response.status}`);
      }
      
      res.json({ ...updated, id: req.params.id });
    } catch (err: any) {
      console.error("Update article failed:", err);
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/articles/:id", async (req, res) => {
    try {
      const url = getFirebaseUrl(`/${req.params.id}.json`);
      console.log(`Deleting from Firebase...`);
      const response = await fetch(url, {
        method: "DELETE"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Firebase Error ${response.status}`);
      }
      res.status(204).send();
    } catch (err: any) {
      console.error("Delete article failed:", err);
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
