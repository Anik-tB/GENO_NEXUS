import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
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

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Missing required file" }, { status: 400 });
    }

    const fileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const fileId = randomUUID();

    // Create uploads/chat directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "chat");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storagePath = `uploads/chat/${fileId}_${fileName}`;
    const filePath = path.join(process.cwd(), "public", storagePath);

    // Save file locally
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);

    return NextResponse.json({ success: true, url: `/${storagePath}`, fileType: file.type });
  } catch (error) {
    console.error("Failed to upload chat file:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
