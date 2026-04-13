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
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (const row of data) {
      const phoneNo = String(row.phoneNo || row.Phone || row.phone);

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
    console.error(err);
    res.status(500).json({ error: "Customer upload failed ❌" });
  }
});


/**
 * 💰 Upload Revenue / Billing
 */
router.post("/upload-revenue", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (const row of data) {
      const phoneNo = String(row.PHONE_NO);

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
          invoiceAmount: row.INVOICE_NET_MNY || 0,
          taxAmount: row.INVOICE_TAX_MNY || 0,
          totalAmount: row.TOTAL_BILLED_AMOUNT || 0,
          paidAmount: row.TOTAL_PAID_AMOUNT || 0,
          revenueRealized: row.NET_TOTAL_REVENUE_REALISED || 0,
          commission: row.COMMISSION_AMT || 0,
        },
      });
    }

    res.json({ message: "Revenue uploaded successfully 🚀" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Revenue upload failed ❌" });
  }
});

export default router;