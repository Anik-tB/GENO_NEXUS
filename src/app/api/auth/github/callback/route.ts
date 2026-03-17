import { NextRequest, NextResponse } from "next/server";
import { assertDatabase } from "@/lib/db";
import { buildSessionCookie, createSession } from "@/lib/auth/sessions";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }
  
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=service_unavailable", request.url));
  }
  
  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      throw new Error("Failed to get access token from GitHub");
    }
    
    // 2. Fetch user profile
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const userData = await userResponse.json();
    const githubId = String(userData.id);
    let githubEmail = userData.email;
    
    // If email is private, fetch from emails endpoint
    if (!githubEmail) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const emailsData = await emailResponse.json();
      const primaryEmail = emailsData.find((e: any) => e.primary && e.verified);
      githubEmail = primaryEmail ? primaryEmail.email : emailsData[0]?.email;
    }
    
    if (!githubEmail) {
      return NextResponse.redirect(new URL("/login?error=invalid_credentials", request.url));
    }
    
    const client = assertDatabase();
    
    // 3. Upsert user in database
    let userId: string;
    
    // Check if user exists by GitHub ID or Email
    const existingUser = await client.query(
      "SELECT id FROM users WHERE github_id = $1 OR email = LOWER($2) LIMIT 1",
      [githubId, githubEmail]
    );
    
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      // Update GitHub ID in case they signed up with email first
      await client.query("UPDATE users SET github_id = $1, email_verified = NOW() WHERE id = $2", [githubId, userId]);
    } else {
      // Create new user (using name from GitHub if available)
      const nameParts = (userData.name || userData.login || "GitHub User").split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || " ";
      
      const newUser = await client.query(
        `INSERT INTO users (first_name, last_name, email, github_id, email_verified, terms_accepted_at, medical_acknowledged_at) 
         VALUES ($1, $2, LOWER($3), $4, NOW(), NOW(), NOW()) 
         RETURNING id`,
        [firstName, lastName, githubEmail, githubId]
      );
      userId = newUser.rows[0].id;
    }
    
    // 4. Create session and redirect
    const session = await createSession(userId, true);
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(buildSessionCookie(session.token, session.expiresAt));
    
    return response;
  } catch (error) {
    console.error("GitHub OAuth Error:", error);
    return NextResponse.redirect(new URL("/login?error=service_unavailable", request.url));
  }
}
