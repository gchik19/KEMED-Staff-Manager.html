import { Router, Request, Response } from "express";
import { db } from "../db";
import { requireAuth, requireRoles } from "../middleware/auth";

export const router = Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  try {
    const ranks = db.prepare("SELECT * FROM ranks ORDER BY category, name").all();
    res.json(ranks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireRoles(["SUPER_ADMIN", "ADMIN"]), (req: any, res: any) => {
  const { name, category } = req.body;
  if (!name || !category) return res.status(400).json({ error: "Name and Category are required" });

  try {
    const info = db.prepare("INSERT INTO ranks (name, category) VALUES (?, ?)").run(name, category);
    res.json({ id: info.lastInsertRowid, name, category });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/bulk", requireRoles(["SUPER_ADMIN", "ADMIN"]), (req: any, res: any) => {
  const { ranks, category } = req.body;
  if (!Array.isArray(ranks) || !category) return res.status(400).json({ error: "Valid ranks array and category are required" });

  try {
    const insert = db.prepare("INSERT INTO ranks (name, category) VALUES (?, ?)");
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insert.run(item, category);
      }
    });
    insertMany(ranks);
    res.json({ success: true, count: ranks.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", requireRoles(["SUPER_ADMIN", "ADMIN"]), (req: any, res: any) => {
  const { name, category } = req.body;
  try {
    db.prepare("UPDATE ranks SET name = ?, category = ? WHERE id = ?").run(name, category, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", requireRoles(["SUPER_ADMIN", "ADMIN"]), (req: any, res: any) => {
  try {
    db.prepare("DELETE FROM ranks WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export const ranksRouter = router;
