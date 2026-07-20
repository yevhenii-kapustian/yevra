import { z } from "zod";

export const cartLineSchema = z.object({
  variantId: z.string().min(1),
  qty: z.number().int().min(1),
});

export const cartSchema = z.array(cartLineSchema).min(1, "Your cart is empty.");

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required.`);

export const checkoutSchema = z.object({
  email: requiredText("Email").email("Enter a valid email address."),
  firstName: requiredText("First name"),
  lastName: requiredText("Last name"),
  phone: requiredText("Phone number"),
  line1: requiredText("Street address"),
  line2: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  city: requiredText("City"),
  state: requiredText("State"),
  postalCode: requiredText("ZIP code"),
  country: requiredText("Country"),
  deliveryMethod: z.enum(["standard", "express"]),
});
