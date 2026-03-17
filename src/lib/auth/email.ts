import { createTransport } from "nodemailer";
import { assertDatabase } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const transporter = createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: process.env.EMAIL_SERVER_PORT === "465",
});

export async function generateVerificationToken(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
  
  const client = assertDatabase();
  
  // Clean up any existing tokens for this user
  await client.query("DELETE FROM verification_tokens WHERE user_id = $1", [userId]);
  
  await client.query(
    "INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [userId, token, expiresAt]
  );
  
  return token;
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${env.appUrl}/api/auth/verify?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"GenoNexus" <noreply@genonexus.com>',
    to: email,
    subject: "Verify your email address - GenoNexus",
    html: `
      <h2>Welcome to GenoNexus!</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
    `
  });
}
