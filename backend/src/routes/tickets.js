import express from "express";
import prisma from "../utils/prisma.js";

const router = express.Router();


// 🟢 1. CREATE TICKET
router.post("/tickets", async (req, res) => {
  try {
    const { phoneNo, issue, priority } = req.body;

    // fetch customer details automatically
    const customer = await prisma.customer.findUnique({
      where: { phoneNo },
    });

    const ticket = await prisma.ticket.create({
      data: {
        phoneNo,
        issue,
        priority,
        status: "OPEN",
      },
    });

    res.json({
      ...ticket,
      customerDetails: customer || null,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});


// 🟡 2. GET ALL TICKETS
router.get("/tickets", async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});


// 🔵 3. UPDATE TICKET (status / assign)
router.put("/tickets/:id", async (req, res) => {
  try {
    const { status, assignedTo } = req.body;

    const ticket = await prisma.ticket.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
  ...(status && { status }),
  ...(assignedTo && { assignedTo }),
},
    });

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

router.get("/tickets/stats", async (req, res) => {
  try {
    const stats = await prisma.ticket.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    // convert to clean object
    const result = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    };

    stats.forEach((s) => {
      result[s.status] = s._count.status;
    });

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch ticket stats" });
  }
});

export default router;