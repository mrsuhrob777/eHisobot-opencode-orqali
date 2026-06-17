import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().min(1, "Required").trim(),
  password: z.string().min(1, "Password is required").trim(),
});

export const SchoolSchema = z.object({
  schoolNumber: z.coerce.number().min(1, "Required"),
  schoolName: z.string().min(1, "Required"),
  region: z.string().min(1, "Required"),
  district: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  subscriptionStatus: z.string().default("active"),
});

export const TeacherSchema = z.object({
  fullName: z.string().min(1, "Required"),
  username: z.string().min(1, "Required"),
  password: z.string().min(6, "Min 6 characters").optional(),
  phone: z.string().optional(),
});

export type FormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;
