import express from "express";
import prisma from "../utils/prisma.js";

const router = express.Router();

router.post("/ask-ai", async (req, res) => {
  try {
    const { question } = req.body;

    const q = question.toLowerCase();

    // 💰 Billing
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
        ? ((totalCollected / totalBilled) * 100).toFixed(2)
        : 0;

    // 🎧 Tickets
    const openTickets = await prisma.ticket.count({
      where: { status: "OPEN" },
    });

    // 🚨 Defaulters
    const unpaidCustomers = await prisma.billing.count({
      where: { paidAmount: 0 },
    });

    let answer = "Sorry, I couldn't understand your question.";

    // 🧠 Simple AI logic
    if (q.includes("collection")) {
      answer = `Collection is at ${collectionPercent}%.`;
    }

    else if (q.includes("ticket")) {
      answer = `There are ${openTickets} open tickets.`;
    }

    else if (q.includes("unpaid") || q.includes("defaulter")) {
      answer = `There are ${unpaidCustomers} unpaid customers.`;
    }

    else if (q.includes("overall") || q.includes("status")) {
      answer = `Collection is ${collectionPercent}%, Open tickets are ${openTickets}, and unpaid customers are ${unpaidCustomers}.`;
    }

    res.json({ answer });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI failed" });
  }
});

export default router;