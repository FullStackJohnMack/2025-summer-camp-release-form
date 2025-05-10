// pages/api/submit.ts
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import PDFDocument from "pdfkit";
import { getMongoClient } from "../../lib/mongodb";
import { Resend } from "resend";
import { ReleaseFormValues } from "../../types/form";

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    // ─── 1) Extract & type‑cast the incoming JSON ────────────────────────
    const data = req.body as ReleaseFormValues;

    // ─── 2) Capture audit metadata ──────────────────────────────────────
    const submittedAt = new Date();
    // X‑Forwarded‑For is set by many proxies; fall back to socket IP
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")[0]
        .trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const userAgent  = req.headers["user-agent"] || "unknown";
    const referer    = (req.headers["referer"] ||
                       req.headers["referrer"] ||
                       "unknown") as string;

    // ─── 3) Generate the PDF in‑memory ────────────────────────────────────
    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 25 });
      const bufs: Buffer[] = [];
      const H1_FONT = "Helvetica-Bold";
      const P_FONT  = "Helvetica";
      const H1_SIZE = 12;
      const P_SIZE  = 10;

      doc.on("data",    bufs.push.bind(bufs));
      doc.on("end",     () => resolve(Buffer.concat(bufs)));
      doc.on("error",   reject);

      // --- Page 1: form fields ---
      doc
        .font(H1_FONT).fontSize(H1_SIZE).text("Child Name")
        .font(P_FONT).fontSize(P_SIZE).text(data.childName)
        .moveDown()

        .font(H1_FONT).fontSize(H1_SIZE).text("Parent Name")
        .font(P_FONT).fontSize(P_SIZE).text(data.parentName)
        .moveDown()

        .font(H1_FONT).fontSize(H1_SIZE).text("Parent Email")
        .font(P_FONT).fontSize(P_SIZE).text(data.parentEmail)
        .moveDown()

        .font(H1_FONT).fontSize(H1_SIZE).text("Parent Phone")
        .font(P_FONT).fontSize(P_SIZE).text(data.parentPhone || "-")
        .moveDown()

        .font(H1_FONT).fontSize(H1_SIZE).text("Child DOB")
        .font(P_FONT).fontSize(P_SIZE).text(data.childDOB || "-")
        .moveDown()

        .font(H1_FONT).fontSize(H1_SIZE).text("Child Address")
        .font(P_FONT).fontSize(P_SIZE).text(data.childAddress || "-")
        .moveDown()

        .font(H1_FONT).fontSize(H1_SIZE).text("Child Medical Notes")
        .font(P_FONT).fontSize(P_SIZE).text(data.childMedicalNotes || "-")
        .moveDown()

        .font(H1_FONT).fontSize(H1_SIZE).text("Child Doctor")
        .font(P_FONT).fontSize(P_SIZE).text(data.childDoctor || "-")
        .moveDown()

        .font(H1_FONT).fontSize(H1_SIZE).text("Child Insurance")
        .font(P_FONT).fontSize(P_SIZE).text(data.childInsurance || "-")
        .moveDown()

        .font(H1_FONT).fontSize(H1_SIZE).text("Emergency Contact")
        .font(P_FONT).fontSize(P_SIZE).text(data.emergencyName || "-")
        .moveDown()

        .font(H1_FONT).fontSize(H1_SIZE).text("Emergency Contact Phone")
        .font(P_FONT).fontSize(P_SIZE).text(data.emergencyPhone || "-");

      // --- Page 2: liability text + signature + audit info ---
      doc.addPage();

      doc
        .font(P_FONT).fontSize(8.5)
        .text(data.liabilityText)
        .moveDown()

        .font(H1_FONT).fontSize(H1_SIZE).text("Signature")
        .font(P_FONT).fontSize(P_SIZE).text(data.signature)
        .moveDown()

        .font(P_FONT).fontSize(8)
        .text(`Digitally signed on: ${data.dateSigned}`)
        .text(`Submitted at:  ${submittedAt.toISOString()}`)
        .text(`IP Address:    ${ip}`)
        .text(`User-Agent:    ${userAgent}`)
        .text(`Referrer URL:  ${referer}`);

      doc.end();
    });

    // ─── 4) Compute a SHA‑256 hash of the PDF ─────────────────────────────
    const pdfHash = crypto
      .createHash("sha256")
      .update(pdfBuffer)
      .digest("hex");

    // ─── 5) Insert form + audit data into MongoDB ───────────────────────
    const client = await getMongoClient();
    await client
      .db()  // or .db("liability-waivers") if you prefer explicit
      .collection("completed-waivers")
      .insertOne({
        ...data,
        submittedAt,
        ip,
        userAgent,
        referer,
        pdfHash,
      });

    // ─── 6) Email the PDF via Resend with the same audit info ───────────
    try {
      const resp = await resend.emails.send({
        from:    process.env.EMAIL_FROM!,
        to:      process.env.EMAIL_TO!.split(","),
        subject: `2025 Summer Camp Release from ${data.parentName}`,
        html: `
          <h2>New Liability Release Submitted</h2>
          <p><strong>Parent:</strong> ${data.parentName}<br/>
             <strong>Child:</strong>  ${data.childName}<br/>
             <strong>When:</strong> ${submittedAt.toISOString()}<br/>
             <strong>IP:</strong>   ${ip}
          </p>
        `,
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
    console.error("❌ submit handler error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// // pages/api/submit.ts
// import crypto from "crypto";
// import type { NextApiRequest, NextApiResponse } from "next";
// import PDFDocument from "pdfkit";
// import { getMongoClient } from "../../lib/mongodb";
// import { Resend } from "resend";
// import { ReleaseFormValues } from "../../types/form"; // adjust path if you moved types

// const resend = new Resend(process.env.RESEND_API_KEY!);

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method !== "POST") return res.status(405).end();

//   try {
//     const data = req.body as ReleaseFormValues;

//     // Capture audit metadata
//     const submittedAt = new Date();
//     // X‑Forwarded‑For is set by many proxies; fall back to socket IP
//     const ip =
//       (req.headers["x-forwarded-for"] as string | undefined)
//         ?.split(",")[0]
//         .trim() ||
//       req.socket.remoteAddress ||
//       "unknown";

//     const userAgent  = req.headers["user-agent"] || "unknown";
//     const referer    = (req.headers["referer"] ||
//                        req.headers["referrer"] ||
//                        "unknown") as string;

//     // build PDF
//     const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
//       const doc = new PDFDocument({ margin: 25 });
//       const bufs: Buffer[] = [];
//       const h1Font: string = "Helvetica-Bold";
//       const pFont: string = "Helvetica";
//       const h1Size: number = 12;
//       const pSize: number = 10;
//       doc.on("data", bufs.push.bind(bufs));
//       doc.on("end", () => resolve(Buffer.concat(bufs)));
//       doc.on("error", reject);

//       doc
//       .font(h1Font)
//       .fontSize(h1Size)
//       .text("Child Name")

//       doc
//       .font(pFont)
//       .fontSize(pSize)
//       .text(data.childName);
//       doc.moveDown();

//       doc
//       .font(h1Font)
//       .fontSize(h1Size)
//       .text("Parent Name");

//       doc
//       .font(pFont)
//       .fontSize(pSize)
//       .text(data.parentName);
//       doc.moveDown();

//       doc
//       .font(h1Font)
//       .fontSize(h1Size)
//       .text("Parent Email"); 

//       doc
//       .font(pFont)
//       .fontSize(pSize)
//       .text(data.parentEmail);
//       doc.moveDown();

//       doc
//       .font(h1Font)
//       .fontSize(h1Size)
//       .text("Parent Phone");

//       doc
//       .font(pFont)
//       .fontSize(pSize)
//       .text(data.parentPhone);
//       doc.moveDown();

//       doc
//       .font(h1Font)
//       .fontSize(h1Size)
//       .text("Child DOB");

//       doc
//       .font(pFont)
//       .fontSize(pSize)
//       .text(data.childDOB);
//       doc.moveDown();

//       doc
//       .font(h1Font)
//       .fontSize(h1Size)
//       .text("Child Address");

//       doc
//       .font(pFont)
//       .fontSize(pSize)
//       .text(data.childAddress);
//       doc.moveDown();

//       doc
//       .font(h1Font)
//       .fontSize(h1Size)
//       .text("Child Medical Notes");

//       doc
//       .font(pFont)
//       .fontSize(pSize)
//       .text(data.childMedicalNotes);
//       doc.moveDown();

//       doc
//       .font(h1Font)
//       .fontSize(h1Size)
//       .text("Child Doctor");

//       doc
//       .font(pFont)
//       .fontSize(pSize)
//       .text(data.childDoctor || "-");
//       doc.moveDown();

//       doc
//       .font(h1Font)
//       .fontSize(h1Size)
//       .text("Child Insurance");

//       doc
//       .font(pFont)
//       .fontSize(pSize)
//       .text(data.childInsurance || "-");
//       doc.moveDown();

//       doc
//       .font(h1Font)
//       .fontSize(h1Size)
//       .text("Emergency Contact");

//       doc
//       .font(pFont)
//       .fontSize(pSize)
//       .text(data.emergencyName || "-");
//       doc.moveDown();

//       doc
//       .font(h1Font)
//       .fontSize(h1Size)
//       .text("Emergency Contact Phone");

//       doc
//       .font(pFont)
//       .fontSize(pSize)
//       .text(data.emergencyPhone || "-");
      
//       doc.addPage();

//       doc
//       .font(pFont)
//       .fontSize(9)
//       .text(data.liabilityText);
//       doc.moveDown();

//       doc
//       .font(h1Font)
//       .fontSize(h1Size)
//       .text("Signature");

//       doc
//       .font(pFont)
//       .fontSize(pSize)
//       .text(data.signature);  
//       doc.moveDown();

//       doc.text("Digitally signed on: " + data.dateSigned);
//       doc.end();
//     });

//     // save to Mongo
//     const client = await getMongoClient();
//     await client
//       .db()
//       .collection("completed-waivers")
//       .insertOne({ ...data, submittedAt: new Date() });

//     try {
//         const resp = await resend.emails.send({
//           from: process.env.EMAIL_FROM!,
//           to:   process.env.EMAIL_TO!.split(","),   
//           subject: `2025 Summer Camp Release from ${data.parentName}`,
//           html: `<p>New release from <strong>${data.parentName}</strong></p>`,
//           attachments: [
//             {
//               filename:     `Release_${data.parentName}.pdf`,
//               content:      pdfBuffer,                 
//             },
//           ],
//         });
      
//         console.log("✅ Resend response:", resp);
//       } catch (err) {
//         console.error("🚨 Resend send error:", err);
//       }

   

//     return res.status(200).json({ ok: true });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: "Server error" });
//   }
// }
