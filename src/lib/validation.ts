import { z } from 'zod';

export const reportSchema = z.object({
  type: z.enum(['BSB', 'CHSB']),
  title: z.string().min(1).max(500),
  data: z.string().min(1),
});

export const schoolUserSchema = z.object({
  fullName: z.string().min(1).max(200),
  login: z.string().min(3).max(50),
  password: z.string().min(4).max(100),
  role: z.enum(['admin', 'teacher', 'director', 'deputy_director']),
});

export const schoolClassSchema = z.object({
  schoolId: z.string().min(1),
  name: z.string().min(1).max(20),
});

export const schoolSubjectSchema = z.object({
  schoolId: z.string().min(1),
  name: z.string().min(1).max(100),
});

export function validate<T>(schema: z.ZodType<T>, input: unknown): { data?: T; error?: string } {
  const result = schema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    return { error: `${first.path.join('.')}: ${first.message}` };
  }
  return { data: result.data };
}
