import express from "express";
import prisma from "../utils/prisma.js";

const router = express.Router();


// 🟢 1. ADD TECHNICIAN
router.post("/technicians", async (req, res) => {
  try {
    const { name, phone, area } = req.body;

    const tech = await prisma.technician.create({
      data: {
        name,
        phone,
        area,
      },
    });

    res.json(tech);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add technician" });
  }
});


// 🟡 2. GET ALL TECHNICIANS
router.get("/technicians", async (req, res) => {
  try {
    const techs = await prisma.technician.findMany();
    res.json(techs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch technicians" });
  }
});


// 🔵 3. GET TECHNICIAN TASKS
router.get("/technicians/:id/tasks", async (req, res) => {
  try {
    const tasks = await prisma.ticket.findMany({
      where: {
        assignedTo: Number(req.params.id),
      },
      include: {
        customer: true,
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

export default router;