import { z } from 'zod';

export const temperatureSchema = z.object({
  temperature: z.number().min(-50).max(100),
  date: z.string(),
  time: z.string(),
  screenshot: z.instanceof(File).optional(),
});

export type TemperatureData = z.infer<typeof temperatureSchema>;

export interface TemperatureRecord {
  id: string;
  temperature: number;
  date: string;
  time: string;
  screenshotUrl?: string;
  createdAt: Date;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}
