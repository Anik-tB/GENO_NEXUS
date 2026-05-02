import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";
import { randomUUID } from "node:crypto";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromSessionToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = assertDatabase();
    const fileId = randomUUID();
    
    // Check if the request is JSON (Remote Link)
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { url, fileName, fileType, patientMetadata } = body;
      
      if (!url || !fileName || !fileType) {
        return NextResponse.json({ error: "Missing required fields for URL link" }, { status: 400 });
      }
      
      await db.query(`
        INSERT INTO dna_files
          (id, user_id, file_name, file_size, file_type, storage_path, status, progress, patient_metadata)
        VALUES
          ($1, $2, $3, 0, $4, $5, 'success', 100, $6)
      `, [fileId, user.id, fileName, fileType, url, patientMetadata ? JSON.stringify(patientMetadata) : null]);

      return NextResponse.json({ success: true, id: fileId });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("fileType") as string;
    const patientMetadataRaw = formData.get("patientMetadata") as string | null;
    let patientMetadata: object | null = null;
    try { if (patientMetadataRaw) patientMetadata = JSON.parse(patientMetadataRaw); } catch {}

    if (!file) {
      return NextResponse.json({ error: "Missing required file" }, { status: 400 });
    }

    const fileName = file.name;
    const fileSize = file.size;

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storagePath = `uploads/${fileId}_${fileName}`;
    const filePath = path.join(process.cwd(), "public", storagePath);

    // Save file locally
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);

    await db.query(`
      INSERT INTO dna_files
        (id, user_id, file_name, file_size, file_type, storage_path, status, patient_metadata)
      VALUES
        ($1, $2, $3, $4, $5, $6, 'processing', $7)
    `, [fileId, user.id, fileName, fileSize, fileType, storagePath, patientMetadata ? JSON.stringify(patientMetadata) : null]);

    return NextResponse.json({ success: true, id: fileId });
  } catch (error) {
    console.error("Failed to record DNA file:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(env.sessionCookieName)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getUserFromSessionToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = assertDatabase();
    const { fileId, patientMetadata } = await req.json();

    if (!fileId || !patientMetadata) {
      return NextResponse.json({ error: "Missing fileId or patientMetadata" }, { status: 400 });
    }

    // Only allow the owner to update their own file's metadata
    await db.query(
      `UPDATE dna_files SET patient_metadata = $1 WHERE id = $2 AND user_id = $3`,
      [JSON.stringify(patientMetadata), fileId, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update patient metadata:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
