import express from "express";
import prisma from "../utils/prisma.js";

const router = express.Router();

router.get("/dashboard", async (req, res) => {
  try {
    const totalBilled = await prisma.billing.aggregate({
      _sum: { totalAmount: true },
    });

    const totalCollected = await prisma.billing.aggregate({
      _sum: { paidAmount: true },
    });

    const totalCommission = await prisma.billing.aggregate({
      _sum: { commission: true },
    });

    const unpaidCustomers = await prisma.billing.count({
      where: {
        paidAmount: 0,
      },
    });

    res.json({
      totalBilled: totalBilled._sum.totalAmount || 0,
      totalCollected: totalCollected._sum.paidAmount || 0,
      totalCommission: totalCommission._sum.commission || 0,
      unpaidCustomers,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Dashboard failed" });
  }
});

export default router;