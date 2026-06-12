import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

function buildInvitationActionToken({ invitationId, email }) {
  return jwt.sign(
    {
      invitationId,
      email,
    },
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function buildInvitationActionUrl({ token, status }) {
  const url = new URL("/invitations/respond", env.BACKEND_URL);
  url.searchParams.set("token", token);
  url.searchParams.set("status", status);
  return url.toString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendInvitationEmail({
  to,
  projectName,
  inviterName,
  invitationId,
}) {
  if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASS) {
    throw new Error("SMTP email configuration is not set");
  }

  const configuredHost = String(env.EMAIL_HOST).trim().toLowerCase();
  const isLocalhostHost =
    configuredHost === "localhost" || configuredHost === "127.0.0.1";
  const isGmailAccount = /@(gmail|googlemail)\.com$/i.test(env.EMAIL_USER);
  const smtpHost = isLocalhostHost && isGmailAccount
    ? "smtp.gmail.com"
    : env.EMAIL_HOST;
  const smtpPort = isLocalhostHost && isGmailAccount
    ? 465
    : env.EMAIL_PORT;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  const token = buildInvitationActionToken({
    invitationId,
    email: to,
  });

  const acceptUrl = buildInvitationActionUrl({
    token,
    status: "ACCEPTED",
  });
  const rejectUrl = buildInvitationActionUrl({
    token,
    status: "REJECTED",
  });

  const safeProjectName = escapeHtml(projectName);
  const safeInviterName = escapeHtml(inviterName);
  const sender = isGmailAccount ? env.EMAIL_USER : env.EMAIL_FROM;

  await transporter.sendMail({
    from: sender,
    to,
    subject: `Invitation to join ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin: 0 0 16px;">You have a new project invitation</h2>
        <p style="margin: 0 0 12px;">
          <strong>${safeInviterName}</strong> invited you to join
          <strong>${safeProjectName}</strong>.
        </p>
        <p style="margin: 0 0 20px;">
          Use the buttons below to accept or reject the invitation.
        </p>
        <p style="margin: 0 0 12px;">
          <a
            href="${acceptUrl}"
            style="display: inline-block; padding: 12px 18px; margin-right: 12px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;"
          >
            Accept invitation
          </a>
          <a
            href="${rejectUrl}"
            style="display: inline-block; padding: 12px 18px; background: #dc2626; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;"
          >
            Reject invitation
          </a>
        </p>
        <p style="margin: 20px 0 0; color: #475569; font-size: 14px;">
          If the buttons do not work, copy these links into your browser:
        </p>
        <p style="margin: 8px 0 0; font-size: 13px; word-break: break-all;">
          Accept: <a href="${acceptUrl}">${acceptUrl}</a>
        </p>
        <p style="margin: 4px 0 0; font-size: 13px; word-break: break-all;">
          Reject: <a href="${rejectUrl}">${rejectUrl}</a>
        </p>
      </div>
    `,
    text: [
      `You have been invited to join ${projectName}.`,
      `Inviter: ${inviterName}`,
      `Accept: ${acceptUrl}`,
      `Reject: ${rejectUrl}`,
    ].join("\n"),
  });
}
