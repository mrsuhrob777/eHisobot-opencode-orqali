import { z } from "zod";

export const LoginSchema = z.object({
  login: z.string().min(1, "Login is required").trim(),
  password: z.string().min(1, "Password is required").trim(),
});

export const SchoolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
});

export type FormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;
