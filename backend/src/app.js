import "dotenv/config";
import express from "express";
import cors from "cors";

import testRoutes from "./routes/test.js";
import uploadRoutes from "./routes/upload.js";
import dashboardRoutes from "./routes/dashboard.js";
import defaulterRoutes from "./routes/defaulters.js";
import oltRoutes from "./routes/olt.js";
import ticketRoutes from "./routes/tickets.js";
import techRoutes from "./routes/technicians.js";
import insightRoutes from "./routes/insights.js";
import aiRoutes from "./routes/ai.js";
import customerRoutes from "./routes/customers.js";

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());

// ---------------- API ROUTES ----------------
app.use("/api", testRoutes);
app.use("/api", uploadRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", defaulterRoutes);
app.use("/api", oltRoutes);
app.use("/api", ticketRoutes);
app.use("/api", techRoutes);
app.use("/api", insightRoutes);
app.use("/api", aiRoutes);
app.use("/api", customerRoutes);

// ---------------- HEALTH CHECK ----------------
app.get("/api/health", (req, res) => {
  res.json({ message: "🚀 BSNL Netra AI Backend Running" });
});

// ---------------- SERVER ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});