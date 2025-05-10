// pages/api/submit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import PDFDocument from "pdfkit";
import { getMongoClient } from "../../lib/mongodb";
import { Resend } from "resend";
import { ReleaseFormValues } from "../../types/form"; // adjust path if you moved types

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const data = req.body as ReleaseFormValues;

    // build PDF
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 25 });
      const bufs: Buffer[] = [];
      const h1Font: string = "Helvetica-Bold";
      const pFont: string = "Helvetica";
      const h1Size: number = 12;
      const pSize: number = 10;
      doc.on("data", bufs.push.bind(bufs));
      doc.on("end", () => resolve(Buffer.concat(bufs)));
      doc.on("error", reject);

      doc
      .font(h1Font)
      .fontSize(h1Size)
      .text("Child Name")

      doc
      .font(pFont)
      .fontSize(pSize)
      .text(data.childName);
      doc.moveDown();

      doc
      .font(h1Font)
      .fontSize(h1Size)
      .text("Parent Name");

      doc
      .font(pFont)
      .fontSize(pSize)
      .text(data.parentName);
      doc.moveDown();

      doc
      .font(h1Font)
      .fontSize(h1Size)
      .text("Parent Email"); 

      doc
      .font(pFont)
      .fontSize(pSize)
      .text(data.parentEmail);
      doc.moveDown();

      doc
      .font(h1Font)
      .fontSize(h1Size)
      .text("Parent Phone");

      doc
      .font(pFont)
      .fontSize(pSize)
      .text(data.parentPhone);
      doc.moveDown();

      doc
      .font(h1Font)
      .fontSize(h1Size)
      .text("Child DOB");

      doc
      .font(pFont)
      .fontSize(pSize)
      .text(data.childDOB);
      doc.moveDown();

      doc
      .font(h1Font)
      .fontSize(h1Size)
      .text("Child Address");

      doc
      .font(pFont)
      .fontSize(pSize)
      .text(data.childAddress);
      doc.moveDown();

      doc
      .font(h1Font)
      .fontSize(h1Size)
      .text("Child Medical Notes");

      doc
      .font(pFont)
      .fontSize(pSize)
      .text(data.childMedicalNotes);
      doc.moveDown();

      doc
      .font(h1Font)
      .fontSize(h1Size)
      .text("Child Doctor");

      doc
      .font(pFont)
      .fontSize(pSize)
      .text(data.childDoctor || "-");
      doc.moveDown();

      doc
      .font(h1Font)
      .fontSize(h1Size)
      .text("Child Insurance");

      doc
      .font(pFont)
      .fontSize(pSize)
      .text(data.childInsurance || "-");
      doc.moveDown();

      doc
      .font(h1Font)
      .fontSize(h1Size)
      .text("Emergency Contact");

      doc
      .font(pFont)
      .fontSize(pSize)
      .text(data.emergencyName || "-");
      doc.moveDown();

      doc
      .font(h1Font)
      .fontSize(h1Size)
      .text("Emergency Contact Phone");

      doc
      .font(pFont)
      .fontSize(pSize)
      .text(data.emergencyPhone || "-");
      
      doc.addPage();

      doc
      .font(pFont)
      .fontSize(9)
      .text(data.liabilityText);
      doc.moveDown();

      doc
      .font(h1Font)
      .fontSize(h1Size)
      .text("Signature");

      doc
      .font(pFont)
      .fontSize(pSize)
      .text(data.signature);  
      doc.moveDown();

      doc.text("Digitally signed on: " + data.dateSigned);
      doc.end();
    });

    // save to Mongo
    const client = await getMongoClient();
    await client
      .db()
      .collection("completed-waivers")
      .insertOne({ ...data, submittedAt: new Date() });

    try {
        const resp = await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to:   process.env.EMAIL_TO!.split(","),   
          subject: `2025 Summer Camp Release from ${data.parentName}`,
          html: `<p>New release from <strong>${data.parentName}</strong></p>`,
          attachments: [
            {
              filename:     `Release_${data.parentName}.pdf`,
              content:      pdfBuffer,                 
            },
          ],
        });
      
        console.log("✅ Resend response:", resp);
      } catch (err) {
        console.error("🚨 Resend send error:", err);
      }

   

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
