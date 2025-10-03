import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const ConfigSchema = z.object({
  WEALTHBOX_TOKEN: z.string().min(1, "WEALTHBOX_TOKEN is required"),
  WEALTHBOX_API_BASE_URL: z
    .string()
    .min(1)
    .default("https://api.crmworkspace.com"),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

function readWealthboxKeyFromFile(): string | undefined {
  try {
    const candidates = [
      path.resolve(process.cwd(), "wealthbox_key.txt"),
      path.resolve(process.cwd(), "./.secrets/wealthbox_key.txt"),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const value = fs.readFileSync(filePath, "utf8").trim();
        if (value) return value;
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function loadConfig(): AppConfig {
  const tokenFromFile = readWealthboxKeyFromFile();
  const env: Record<string, string | undefined> = {
    WEALTHBOX_TOKEN: process.env.WEALTHBOX_TOKEN ?? tokenFromFile,
    WEALTHBOX_API_BASE_URL:
      process.env.WEALTHBOX_API_BASE_URL ?? "https://api.crmworkspace.com",
  };
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(", ");
    throw new Error(`Invalid configuration: ${msg}`);
  }
  return parsed.data;
}

