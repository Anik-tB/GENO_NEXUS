import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";
import { buildPharmacogenomicsProfile } from "@/lib/pharmacogenomics";

async function getAuthedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;
  if (!token) return null;

  return getUserFromSessionToken(token);
}

export async function GET() {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = assertDatabase();

    const result = await db.query(
      `
        SELECT
          cr.mutations_found,
          cr.indels_found,
          df.file_name
        FROM comparison_results cr
        JOIN dna_files df ON cr.query_file_id = df.id
        WHERE (df.user_id = $1 OR df.patient_user_id = $1)
          AND cr.status = 'completed'
        ORDER BY cr.created_at DESC
        LIMIT 1
      `,
      [user.id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        buildPharmacogenomicsProfile({
          generatedAt: new Date(),
        }),
      );
    }

    const row = result.rows[0];

    return NextResponse.json(
      buildPharmacogenomicsProfile({
        fileName: row.file_name,
        mutations: row.mutations_found,
        indels: row.indels_found,
        generatedAt: new Date(),
      }),
    );
  } catch (error) {
    console.error("GET /api/copilot/pharmacogenomics error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
