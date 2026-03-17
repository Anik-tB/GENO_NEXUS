import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  remember: z.boolean().optional()
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2).max(50),
    lastName: z.string().trim().min(2).max(50),
    email: z.string().trim().email(),
    password: z
      .string()
      .min(12)
      .regex(/[a-z]/, "Password must contain a lowercase letter.")
      .regex(/[A-Z]/, "Password must contain an uppercase letter.")
      .regex(/\d/, "Password must contain a number."),
    confirmPassword: z.string().min(12),
    termsAccepted: z.literal(true),
    medicalAcknowledged: z.literal(true)
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });

export const resetPasswordSchema = z.object({
  email: z.string().trim().email()
});

