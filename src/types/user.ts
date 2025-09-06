import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
});

export type UserData = z.infer<typeof userSchema>;

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}
