import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookie, createSession } from "@/lib/auth/sessions";
import { findOrCreateFirebaseGoogleUser } from "@/lib/auth/users";
import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getRedirectPathForCategory } from "@/lib/auth/portal";

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
}

interface FirebaseSessionRequestBody {
  idToken?: unknown;
  remember?: unknown;
}

function splitDisplayName(name: string) {
  const [firstName, ...lastNameParts] = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: firstName || "Google",
    lastName: lastNameParts.join(" ") || "User"
  };
}

export async function POST(request: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: "firebase_not_configured" }, { status: 503 });
  }

  let body: FirebaseSessionRequestBody;

  try {
    body = (await request.json()) as FirebaseSessionRequestBody;
  } catch {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const idToken = typeof body.idToken === "string" ? body.idToken : "";
  const remember = body.remember === true;

  if (!idToken) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  try {
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken);

    if (decodedToken.firebase.sign_in_provider !== "google.com") {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const email = typeof decodedToken.email === "string" ? decodedToken.email.trim() : "";
    const emailVerified = decodedToken.email_verified === true;

    if (!email || !emailVerified) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const name = typeof decodedToken.name === "string" ? decodedToken.name : "";
    const { firstName, lastName } = splitDisplayName(name);
    const user = await findOrCreateFirebaseGoogleUser({
      firebaseUid: decodedToken.uid,
      email,
      firstName,
      lastName
    });

    const session = await createSession(user.id, remember, undefined, {
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
      isTrusted: true,
    });
    const redirectTo = getRedirectPathForCategory(user.accountCategory);
    const response = NextResponse.json({ ok: true, redirectTo });
    response.cookies.set(buildSessionCookie(session.token, session.expiresAt));
    return response;
  } catch (error) {
    console.error("Firebase Google Auth Error:", error);
    return NextResponse.json({ error: "google_sign_in_failed" }, { status: 503 });
  }
}
