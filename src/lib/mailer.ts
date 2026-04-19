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

function dedupeValidEmails(emails: string[]): string[] {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const normalized = emails
    .map((value) => value.trim().toLowerCase())
    .filter((value) => emailRegex.test(value));

  return Array.from(new Set(normalized));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface AcademicAlertEmailInput {
  recipients: string[];
  studentName: string;
  studentIdentifier?: string;
  mentorName?: string;
  title: string;
  message: string;
  riskLevel?: "low" | "medium" | "high";
  actionPath?: string;
}

export async function sendAcademicAlertEmail(input: AcademicAlertEmailInput): Promise<void> {
  const recipients = dedupeValidEmails(input.recipients);
  if (recipients.length === 0) {
    return;
  }

  const transporter = createTransporter();
  const actionUrl = input.actionPath
    ? `${process.env.APP_BASE_URL?.replace(/\/$/, "") || "https://tarkshashtra26.vercel.app"}${input.actionPath}`
    : undefined;

  const studentLine = input.studentIdentifier
    ? `${input.studentName} (${input.studentIdentifier})`
    : input.studentName;

  const riskLine = input.riskLevel ? `Risk level: ${input.riskLevel.toUpperCase()}` : undefined;
  const safeTitle = escapeHtml(input.title);
  const safeStudentLine = escapeHtml(studentLine);
  const safeMentorName = input.mentorName ? escapeHtml(input.mentorName) : undefined;
  const safeMessage = escapeHtml(input.message);
  const safeRiskLine = riskLine ? escapeHtml(riskLine) : undefined;

  await transporter.sendMail({
    from: `ShikshaSetu<${MAIL_SENDER}>`,
    to: MAIL_SENDER,
    bcc: recipients,
    subject: `[ShikshaSetu Alert] ${input.title}`,
    text: [
      input.title,
      `Student: ${studentLine}`,
      input.mentorName ? `Faculty mentor: ${input.mentorName}` : undefined,
      riskLine,
      `Details: ${input.message}`,
      actionUrl ? `Action link: ${actionUrl}` : undefined,
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <h2 style="margin: 0 0 12px;">${safeTitle}</h2>
        <p style="margin: 0 0 8px;"><strong>Student:</strong> ${safeStudentLine}</p>
        ${safeMentorName ? `<p style="margin: 0 0 8px;"><strong>Faculty Mentor:</strong> ${safeMentorName}</p>` : ""}
        ${safeRiskLine ? `<p style="margin: 0 0 8px;"><strong>${safeRiskLine}</strong></p>` : ""}
        <p style="margin: 0 0 16px;">${safeMessage}</p>
        <p style="margin: 0; color: #6b7280; font-size: 13px;">This message was sent to the student, parent, and assigned faculty mentor.</p>
      </div>
    `,
  });
}

export { MAIL_SENDER };
