import express from "express";
import prisma from "../utils/prisma.js";

const router = express.Router();

router.get("/customers", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;