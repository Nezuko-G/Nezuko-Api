import nodemailer from "nodemailer";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseSecureValue(value: string | undefined): boolean {
  if (!value) return false;
  return value.toLowerCase() === "true";
}

export const mailer = nodemailer.createTransport({
  host: getEnv("SMTP_HOST"),
  port: Number(getEnv("SMTP_PORT")),
  secure: parseSecureValue(process.env.SMTP_SECURE),
  auth: {
    user: getEnv("SMTP_USER"),
    pass: getEnv("SMTP_PASS"),
  },
});
