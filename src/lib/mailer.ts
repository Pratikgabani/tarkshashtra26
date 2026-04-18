import nodemailer from "nodemailer";
import { OTP_EXPIRY_MINUTES } from "@/src/lib/otp";

const MAIL_SENDER = "resihubproject@gmail.com";

function createTransporter() {
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailAppPassword) {
    throw new Error("Missing environment variable: GMAIL_APP_PASSWORD");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: MAIL_SENDER,
      pass: gmailAppPassword,
    },
  });
}

export async function sendSignupOtpEmail(to: string, otp: string): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `ShikshaSetu<${MAIL_SENDER}>`,
    to,
    subject: `Your signup OTP is ${otp}`,
    text: `Your signup OTP is ${otp}. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
        <h2 style="margin: 0 0 12px;">Your signup OTP is ${otp}</h2>
        <p style="margin: 0 0 16px;">Use this OTP to complete your ShikshaSetu registration:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; display: inline-block; margin-bottom: 16px;">
          ${otp}
        </div>
        <p style="margin: 0 0 8px;">This OTP will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="margin: 0; color: #6b7280; font-size: 13px;">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export { MAIL_SENDER };
