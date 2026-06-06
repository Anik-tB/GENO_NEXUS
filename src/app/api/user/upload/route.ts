import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { isNormalUserCategory } from "@/lib/auth/portal";
import { assertDatabase } from "@/lib/db";
import { randomUUID } from "node:crypto";
import fs from "fs";
import path from "path";

const ALLOWED_EXTENSIONS = ["fasta", "fa", "vcf", "fna", "zip"];
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(request: NextRequest) {
  // ── Auth Check ──────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(env.sessionCookieName)?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let user = null;
  try {
    user = await getUserFromSessionToken(sessionToken);
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only normal users (patient, caregiver) can use this endpoint
  if (!isNormalUserCategory(user.accountCategory)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── File Validation ─────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum allowed size is 100 MB.` },
      { status: 413 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type ".${ext}". Please upload a FASTA, VCF, or FNA file.` },
      { status: 415 }
    );
  }

  const referenceUrl = formData.get("referenceUrl")?.toString() || null;
  const patientMetadataRaw = formData.get("patientMetadata")?.toString() || null;
  const patientIdRaw = formData.get("patientId")?.toString() || null;
  const fileId = randomUUID();

  let patientUserId = null;
  if (user.accountCategory === "patient") {
    patientUserId = user.id;
  } else if (user.accountCategory === "caregiver" && patientIdRaw) {
    patientUserId = patientIdRaw;
  }

  // ── Process Upload ──────────────────────────────────────────────────────
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storagePath = `uploads/${fileId}_${file.name}`;
    const filePath = path.join(process.cwd(), "public", storagePath);

    // Save file locally
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);

    const db = assertDatabase();
    
    // Store referenceUrl and patientMetadata for later use in analysis
    let metadataObj: any = {};
    if (patientMetadataRaw) {
      try { metadataObj = JSON.parse(patientMetadataRaw); } catch {}
    }
    if (referenceUrl) metadataObj.referenceUrl = referenceUrl;
    const patientMetadata = Object.keys(metadataObj).length > 0 ? JSON.stringify(metadataObj) : null;

    await db.query(`
      INSERT INTO dna_files
        (id, user_id, patient_user_id, file_name, file_size, file_type, storage_path, status, patient_metadata)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, 'success', $8)
    `, [fileId, user.id, patientUserId, file.name, file.size, ext, storagePath, patientMetadata]);

    await db.query(`
      INSERT INTO user_notifications (user_id, title, message, type, link)
      VALUES ($1, $2, $3, $4, $5)
    `, [user.id, "DNA Sequence Uploaded", `Your DNA sequence file '${file.name}' was successfully uploaded and is ready for analysis.`, "info", "/user/results"]);

    return NextResponse.json({
      ok: true,
      message: "File uploaded successfully.",
      analysisId: fileId,
      fileName: file.name,
      fileSize: file.size,
      referenceUrl,
      status: "success",
    });
  } catch (error) {
    console.error("Upload process failed:", error);
    return NextResponse.json({ error: "Failed to process and store file." }, { status: 500 });
  }
}
