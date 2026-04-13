import express from "express";
import prisma from "../utils/prisma.js";

const router = express.Router();

router.get("/insights", async (req, res) => {
  try {
    // 💰 Billing data
    const billing = await prisma.billing.aggregate({
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    const totalBilled = billing._sum.totalAmount || 0;
    const totalCollected = billing._sum.paidAmount || 0;

    const collectionPercent =
      totalBilled > 0
        ? (totalCollected / totalBilled) * 100
        : 0;

    // 🎧 Ticket stats
    const ticketStats = await prisma.ticket.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    let openTickets = 0;

    ticketStats.forEach((t) => {
      if (t.status === "OPEN") {
        openTickets = t._count.status;
      }
    });

    // 🚨 Defaulters
    const unpaidCustomers = await prisma.billing.count({
      where: { paidAmount: 0 },
    });

    // 🧠 Generate insights
    const insights = [];

    // Collection insight
    if (collectionPercent < 60) {
      insights.push("🚨 Low collection efficiency. Focus on recovery.");
    } else if (collectionPercent < 80) {
      insights.push("⚠️ Moderate collection. Can improve.");
    } else {
      insights.push("✅ Collection performance is strong.");
    }

    // Ticket insight
    if (openTickets > 20) {
      insights.push("🚨 High number of open tickets. Service delay risk.");
    }

    // Defaulter insight
    if (unpaidCustomers > 100) {
      insights.push("⚠️ Large number of unpaid customers.");
    }

    res.json({
      collectionPercent: collectionPercent.toFixed(2),
      openTickets,
      unpaidCustomers,
      insights,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Insights failed" });
  }
});

export default router;