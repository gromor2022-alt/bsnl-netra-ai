import express from "express";
import prisma from "../utils/prisma.js";

const router = express.Router();

router.get("/defaulters", async (req, res) => {
  try {
    const defaulters = await prisma.billing.groupBy({
      by: ["phoneNo"],
      where: {
        paidAmount: 0,
      },
      _sum: {
        totalAmount: true,
      },
      orderBy: {
        _sum: {
          totalAmount: "desc",
        },
      },
      take: 20,
    });

    const enriched = await Promise.all(
      defaulters.map(async (d) => {
        const customer = await prisma.customer.findUnique({
          where: { phoneNo: d.phoneNo },
        });

        return {
          phoneNo: d.phoneNo,
          totalDue: d._sum.totalAmount,
          area: customer?.area || null,
          olt: customer?.olt || null,
        };
      })
    );

    res.json(enriched);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch defaulters" });
  }
});

export default router;