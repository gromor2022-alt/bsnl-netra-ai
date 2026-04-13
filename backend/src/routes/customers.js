import express from "express";
import prisma from "../utils/prisma.js";

const router = express.Router();

router.get("/customers", async (req, res) => {
  const customers = await prisma.customer.findMany({
    select: { phoneNo: true }
  });
  res.json(customers);
});

export default router; //
