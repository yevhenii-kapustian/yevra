import { z } from "zod";

export const RETURN_REASONS = ["defective", "damaged_in_shipping", "print_error", "other"] as const;

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const;

export const createReturnRequestSchema = z.object({
  orderItemId: z.string().min(1, "Missing order item."),
  reason: z.enum(RETURN_REASONS, { message: "Please choose a reason." }),
  description: z.string().trim().min(1, "Please describe the issue."),
});

export const returnPhotoSchema = z
  .instanceof(File, { message: "Please attach a photo." })
  .refine((file) => file.size > 0, "Please attach a photo.")
  .refine((file) => file.size <= MAX_PHOTO_BYTES, "Photo must be under 5MB.")
  .refine(
    (file) => ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number]),
    "Photo must be a JPEG, PNG, WEBP, or HEIC image."
  );

export const adminNoteSchema = z.string().trim().min(1, "A note is required to reject a request.");
