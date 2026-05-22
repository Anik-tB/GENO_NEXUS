import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { isNormalUserCategory } from "@/lib/auth/portal";

const ALLOWED_EXTENSIONS = ["fasta", "fa", "vcf", "txt", "zip"];
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
      { error: `Unsupported file type ".${ext}". Please upload a FASTA, VCF, or TXT file.` },
      { status: 415 }
    );
  }

  // ── Process Upload ──────────────────────────────────────────────────────
  // TODO: Replace this stub with actual storage logic:
  //   1. Upload file to Firebase Storage (or AWS S3)
  //   2. Store file metadata in PostgreSQL (user_id, file_url, file_name, file_size)
  //   3. Trigger FastAPI genomics analysis pipeline
  //   4. Return analysis job ID

  // Stub response for now
  const analysisId = `analysis_${user.id}_${Date.now()}`;

  return NextResponse.json({
    ok: true,
    message: "File uploaded successfully. Analysis has started.",
    analysisId,
    fileName: file.name,
    fileSize: file.size,
    status: "processing",
  });
}
