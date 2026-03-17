import { NextRequest, NextResponse } from "next/server";
import { assertDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  const client = assertDatabase();
  
  try {
    // Check if token exists and is valid
    const result = await client.query(
      "SELECT user_id, expires_at FROM verification_tokens WHERE token = $1",
      [token]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }
    
    const { user_id: userId, expires_at: expiresAt } = result.rows[0];
    
    if (new Date() > new Date(expiresAt)) {
      await client.query("DELETE FROM verification_tokens WHERE token = $1", [token]);
      return NextResponse.redirect(new URL("/login?error=expired_token", request.url));
    }
    
    // Update user to verified
    await client.query(
      "UPDATE users SET email_verified = NOW() WHERE id = $1",
      [userId]
    );
    
    // Cleanup token
    await client.query("DELETE FROM verification_tokens WHERE token = $1", [token]);
    
    return NextResponse.redirect(new URL("/dashboard?verified=true", request.url));
  } catch (error) {
    console.error("Verification failed:", error);
    return NextResponse.redirect(new URL("/login?error=service_unavailable", request.url));
  }
}
