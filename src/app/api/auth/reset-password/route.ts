import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, consumePasswordResetToken } from "@/lib/auth/password-resets";
import { hashPassword } from "@/lib/auth/password";
import { findUserByEmail } from "@/lib/auth/users";
import { env } from "@/lib/env";
import {
  completePasswordResetSchema,
  resetPasswordSchema
} from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = formData.get("token");

  if (typeof token === "string" && token.length > 0) {
    const parsed = completePasswordResetSchema.safeParse({
      token,
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword")
    });

    if (!parsed.success) {
      return NextResponse.redirect(
        new URL(`/reset-password?token=${encodeURIComponent(token)}&error=validation`, request.url)
      );
    }

    try {
      const passwordHash = await hashPassword(parsed.data.password);
      const didReset = await consumePasswordResetToken(parsed.data.token, passwordHash);
      const target = didReset
        ? "/login?status=password_reset"
        : `/reset-password?token=${encodeURIComponent(token)}&error=invalid_token`;

      return NextResponse.redirect(new URL(target, request.url));
    } catch {
      return NextResponse.redirect(
        new URL(`/reset-password?token=${encodeURIComponent(token)}&error=service_unavailable`, request.url)
      );
    }
  }

  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/reset-password?error=validation", request.url));
  }

  try {
    const user = await findUserByEmail(parsed.data.email);

    if (user) {
      const reset = await createPasswordResetToken(user.id);

      if (!env.isProduction) {
        const resetUrl = new URL(
          `/reset-password?token=${encodeURIComponent(reset.token)}`,
          env.appUrl
        );
        console.info(`Password reset URL for ${user.email}: ${resetUrl.toString()}`);
      }
    }

    return NextResponse.redirect(new URL("/reset-password?status=sent", request.url));
  } catch {
    return NextResponse.redirect(new URL("/reset-password?error=service_unavailable", request.url));
  }
}
