import { z } from "zod";

export const phoneSchema = z.string()
  .trim()
  .min(7, "Phone number must be at least 7 digits")
  .max(20, "Phone number must be less than 20 characters")
  .regex(/^[+]?[\d\s()-]+$/, "Invalid phone number format")
  .transform((val) => val.trim());

export const emailSchema = z.string()
  .email("Invalid email address")
  .min(5, "Email is too short")
  .max(100, "Email is too long");

export const bookingSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  customerName: z.string().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;