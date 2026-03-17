import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email")
  });

  const target = parsed.success
    ? "/reset-password?status=sent"
    : "/reset-password?error=validation";

  return NextResponse.redirect(new URL(target, request.url));
}

