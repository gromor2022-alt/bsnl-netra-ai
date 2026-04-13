import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import prisma from "../utils/prisma.js";

const router = express.Router();

// File upload config
const upload = multer({ dest: "uploads/" });

/**
 * 📁 Upload Customers
 */
router.post("/upload-customers", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (const row of data) {
      const phoneNo = String(row.phoneNo || row.Phone || row.phone);

      if (!phoneNo) continue;

      await prisma.customer.upsert({
        where: { phoneNo },
        update: {
          area: row.area || row.Area || null,
          olt: row.olt || row.OLT || null,
        },
        create: {
          phoneNo,
          area: row.area || row.Area || null,
          olt: row.olt || row.OLT || null,
        },
      });
    }

    res.json({ message: "Customers uploaded successfully ✅" });

  } catch (err) {
    console.error("Customer Upload Error:", err);
    res.status(500).json({ error: "Customer upload failed ❌" });
  }
});


/**
 * 💰 Upload Revenue / Billing
 */
router.post("/upload-revenue", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (const row of data) {
      const phoneNo = String(row.PHONE_NO);

      if (!phoneNo) continue;

      // Ensure customer exists
      await prisma.customer.upsert({
        where: { phoneNo },
        update: {},
        create: {
          phoneNo,
          olt: row.OLT_IP || null,
          area: row.SSA || null,
        },
      });

      // Insert billing
      await prisma.billing.create({
        data: {
          phoneNo,
          invoiceAmount: Number(row.INVOICE_NET_MNY || 0),
          taxAmount: Number(row.INVOICE_TAX_MNY || 0),
          totalAmount: Number(row.TOTAL_BILLED_AMOUNT || 0),
          paidAmount: Number(row.TOTAL_PAID_AMOUNT || 0),
          revenueRealized: Number(row.NET_TOTAL_REVENUE_REALISED || 0),
          commission: Number(row.COMMISSION_AMT || 0),
        },
      });
    }

    res.json({ message: "Revenue uploaded successfully 🚀" });

  } catch (err) {
    console.error("Revenue Upload Error:", err);
    res.status(500).json({ error: "Revenue upload failed ❌" });
  }
});

export default router;