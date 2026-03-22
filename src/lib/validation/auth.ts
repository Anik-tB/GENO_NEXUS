import { z } from "zod";
import { ACCOUNT_CATEGORIES } from "@/lib/auth/account-category";

function hasFirstAndLastName(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length >= 2;
}

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  remember: z.boolean().optional()
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3)
      .max(100)
      .refine(hasFirstAndLastName, "Please enter your first and last name."),
    email: z.string().trim().email(),
    accountCategory: z.enum(ACCOUNT_CATEGORIES),
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

export const completePasswordResetSchema = z
  .object({
    token: z.string().trim().min(1),
    password: z
      .string()
      .min(12)
      .regex(/[a-z]/, "Password must contain a lowercase letter.")
      .regex(/[A-Z]/, "Password must contain an uppercase letter.")
      .regex(/\d/, "Password must contain a number."),
    confirmPassword: z.string().min(12)
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });
