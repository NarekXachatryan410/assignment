import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import cookieParser from "cookie-parser";

import typeDefs from "./schema/typeDefs.js";
import resolvers from "./schema/resolvers.js";
import env from "./config/env.js";
import { prisma } from "../prisma/db.js";

function renderInvitationResponsePage({ title, message, accent = "#8b5cf6" }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Arial, sans-serif;
        background: #020617;
        color: white;
        padding: 24px;
      }
      .card {
        width: 100%;
        max-width: 560px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 20px;
        padding: 32px;
        text-align: center;
        box-shadow: 0 30px 80px rgba(0,0,0,0.35);
      }
      .badge {
        display: inline-block;
        padding: 8px 14px;
        border-radius: 999px;
        background: ${accent};
        color: white;
        font-weight: 700;
        margin-bottom: 18px;
      }
      a.button {
        display: inline-block;
        margin-top: 22px;
        padding: 12px 18px;
        border-radius: 10px;
        background: white;
        color: #0f172a;
        text-decoration: none;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">Project Invitation</div>
      <h1>${title}</h1>
      <p>${message}</p>
      <a class="button" href="${env.FRONTEND_URL}/login">Go to app</a>
    </div>
  </body>
</html>`;
}

export const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/invitations/respond", async (req, res) => {
  const token = String(req.query.token || "");
  const status = String(req.query.status || "").toUpperCase();

  if (!token || !["ACCEPTED", "REJECTED"].includes(status)) {
    return res
      .status(400)
      .send(
        renderInvitationResponsePage({
          title: "Invalid invitation link",
          message: "This invitation link is missing required information.",
          accent: "#dc2626",
        }),
      );
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const invitationId = payload.invitationId;
    const email = String(payload.email || "").toLowerCase();

    if (!invitationId || !email) {
      throw new Error("Invalid invitation token");
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return res
        .status(404)
        .send(
          renderInvitationResponsePage({
            title: "Invitation not found",
            message: "This invitation no longer exists.",
            accent: "#dc2626",
          }),
        );
    }

    if (invitation.email.toLowerCase() !== email) {
      return res
        .status(403)
        .send(
          renderInvitationResponsePage({
            title: "Invitation mismatch",
            message: "This link does not match the intended invitee.",
            accent: "#dc2626",
          }),
        );
    }

    if (invitation.status !== "PENDING") {
      const label = invitation.status.toLowerCase();
      return res
        .status(200)
        .send(
          renderInvitationResponsePage({
            title: `Invitation already ${label}`,
            message: `This invitation was already ${label}.`,
            accent: invitation.status === "ACCEPTED" ? "#16a34a" : "#dc2626",
          }),
        );
    }

    if (status === "ACCEPTED") {
      await prisma.membership.upsert({
        where: {
          userId_projectId: {
            userId: invitation.invitedUserId,
            projectId: invitation.projectId,
          },
        },
        update: {},
        create: {
          userId: invitation.invitedUserId,
          projectId: invitation.projectId,
        },
      });
    }

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status },
    });

    return res
      .status(200)
      .send(
        renderInvitationResponsePage({
          title:
            status === "ACCEPTED"
              ? "Invitation accepted"
              : "Invitation rejected",
          message:
            status === "ACCEPTED"
              ? "You have joined the project successfully."
              : "You have rejected the invitation.",
          accent: status === "ACCEPTED" ? "#16a34a" : "#dc2626",
        }),
      );
  } catch {
    return res
      .status(400)
      .send(
        renderInvitationResponsePage({
          title: "Invalid or expired link",
          message:
            "This invitation link is invalid or has expired. Please ask for a new invitation.",
          accent: "#dc2626",
        }),
      );
  }
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

app.use(
  "/api",
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      const token = req.cookies.token;

      let user = null;

      if (token) {
        try {
          user = jwt.verify(token, env.JWT_SECRET);
        } catch {}
      }

      return {
        req,
        res,
        user,
      };
    },
  }),
);
