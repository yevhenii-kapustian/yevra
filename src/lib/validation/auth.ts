import { z } from "zod";

const email = z.string().trim().min(1, "Email is required.").email("Enter a valid email address.");
const password = z.string().min(6, "Password must be at least 6 characters.");

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required."),
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z.object({
  email,
  password,
  fullName: z.string().trim().min(1, "Name is required."),
});

export const requestPasswordResetSchema = z.object({
  email,
});

export const updatePasswordSchema = z.object({
  password,
});

export const createAccountFromOrderSchema = z.object({
  orderId: z.string().min(1, "Missing order."),
  password,
});
