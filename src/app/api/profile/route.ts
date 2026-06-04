import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { updateUserProfile } from "@/lib/auth/users";
import { env } from "@/lib/env";
import { assertDatabase } from "@/lib/db";

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
      `SELECT id, first_name, last_name, email, account_category,
              bio, job_title, avatar_url, phone, organization,
              github_id, google_id, firebase_uid,
              email_verified, created_at, last_login_at, research_opt_in,
              (SELECT COUNT(*) FROM dna_files WHERE user_id = $1) AS dna_files_count,
              (SELECT COUNT(*) FROM comparison_results cr
               JOIN dna_files df ON df.id = cr.query_file_id
               WHERE df.user_id = $1) AS analyses_count
       FROM users
       WHERE id = $1`,
      [user.id]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      profile: {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        accountCategory: row.account_category,
        bio: row.bio,
        jobTitle: row.job_title,
        avatarUrl: row.avatar_url,
        phone: row.phone,
        organization: row.organization,
        githubId: row.github_id,
        googleId: row.google_id,
        firebaseUid: row.firebase_uid,
        emailVerified: row.email_verified,
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at,
        researchOptIn: row.research_opt_in,
        dnaFilesCount: parseInt(row.dna_files_count, 10) || 0,
        analysesCount: parseInt(row.analyses_count, 10) || 0,
      },
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, bio, jobTitle, phone, organization, accountCategory, researchOptIn, avatarUrl } = body;

    const db = assertDatabase();
    if (typeof researchOptIn === 'boolean') {
      await db.query(`UPDATE users SET research_opt_in = $1 WHERE id = $2`, [researchOptIn, user.id]);
    }

    const updated = await updateUserProfile(user.id, {
      firstName: firstName?.trim() || undefined,
      lastName: lastName?.trim() || undefined,
      bio: bio?.trim() ?? undefined,
      jobTitle: jobTitle?.trim() ?? undefined,
      phone: phone?.trim() ?? undefined,
      organization: organization?.trim() ?? undefined,
      accountCategory: accountCategory || undefined,
      avatarUrl: avatarUrl || undefined,
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = assertDatabase();
    // Delete user from database. This should cascade and delete sessions, dna_files, etc.
    await db.query(`DELETE FROM users WHERE id = $1`, [user.id]);

    // Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete(env.sessionCookieName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
