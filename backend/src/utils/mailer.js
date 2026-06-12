import nodemailer from "nodemailer";
import env from "../config/env.js";

export async function sendInvitationEmail({ to, projectName, inviterName }) {
  const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: env.EMAIL_USER && env.EMAIL_PASS
      ? {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASS,
        }
      : undefined,
  });

  if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASS) {
    throw new Error("SMTP email configuration is not set");
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: `You have been invited to ${projectName}`,
    html: `
      <p>Hello,</p>
      <p>${inviterName} invited you to join the project <strong>${projectName}</strong>.</p>
      <p>Please open your invitations in the app to accept or reject this invitation.</p>
    `,
  });
}
