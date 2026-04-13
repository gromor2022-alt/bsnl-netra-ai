import express from "express";
import prisma from "../utils/prisma.js";

const router = express.Router();

router.get("/olt-performance", async (req, res) => {
  try {
    const oltData = await prisma.customer.groupBy({
      by: ["olt"],
      _count: {
        phoneNo: true,
      },
    });

    const enriched = await Promise.all(
      oltData.map(async (olt) => {
        const billing = await prisma.billing.aggregate({
          where: {
            customer: {
              olt: olt.olt,
            },
          },
          _sum: {
            totalAmount: true,
            paidAmount: true,
          },
        });

        const unpaidCount = await prisma.billing.count({
          where: {
            paidAmount: 0,
            customer: {
              olt: olt.olt,
            },
          },
        });

        const totalBilled = billing._sum.totalAmount || 0;
        const totalCollected = billing._sum.paidAmount || 0;

        const collectionPercent =
          totalBilled > 0
            ? ((totalCollected / totalBilled) * 100).toFixed(2)
            : 0;

        return {
          olt: olt.olt,
          totalCustomers: olt._count.phoneNo,
          totalBilled,
          totalCollected,
          unpaidCustomers: unpaidCount,
          collectionPercent: Number(collectionPercent),
        };
      })
    );

    // 🔥 Find top & worst
    const sorted = [...enriched].sort(
      (a, b) => b.collectionPercent - a.collectionPercent
    );

    const topOLT = sorted[0] || null;
    const worstOLT = sorted[sorted.length - 1] || null;

    res.json({
      oltData: enriched,
      topOLT,
      worstOLT,
    });

  } catch (error) {
    console.error(error);
   res.status(500).json({ error: "OLT performance failed" });
  }
router.get("/olt-performance", async (req, res) => {
  try {
    const data = await prisma.billing.groupBy({
      by: ["phoneNo"],
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    const result = {};

    for (const row of data) {
      const customer = await prisma.customer.findUnique({
        where: { phoneNo: row.phoneNo },
      });

      if (!customer?.olt) continue;

      if (!result[customer.olt]) {
        result[customer.olt] = {
          total: 0,
          collected: 0,
        };
      }

      result[customer.olt].total += row._sum.totalAmount || 0;
      result[customer.olt].collected += row._sum.paidAmount || 0;
    }

    // convert to array
    const final = Object.keys(result).map((olt) => {
      const total = result[olt].total;
      const collected = result[olt].collected;

      return {
        olt,
        total,
        collected,
        percentage: total ? (collected / total) * 100 : 0,
      };
    });

    // sort by performance
    final.sort((a, b) => b.percentage - a.percentage);

    res.json({
      data: final,
      best: final[0] || null,
      worst: final[final.length - 1] || null,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch OLT performance" });
  }
});

});

export default router;