import { jest, describe, expect, test, afterEach } from "@jest/globals";
import jwt from "jsonwebtoken";
import { createPrismaMock, loadApp, testEnv } from "./helpers.js";

let server;

jest.setTimeout(20000);

afterEach(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = undefined;
  }
});

async function startTestServer(app) {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });

  return server.address().port;
}

describe("invitation response endpoint", () => {
  test("successful invitation acceptance creates membership and marks the invite accepted", async () => {
    const prisma = createPrismaMock();
    const invitation = {
      id: "inv-1",
      email: "invitee@example.com",
      status: "PENDING",
      invitedUserId: "user-2",
      projectId: "project-1",
    };

    prisma.invitation.findUnique.mockResolvedValue(invitation);
    prisma.invitation.update.mockResolvedValue({
      ...invitation,
      status: "ACCEPTED",
    });
    prisma.membership.upsert.mockResolvedValue({});

    const { app } = await loadApp({ prisma });
    const port = await startTestServer(app);
    const token = jwt.sign(
      { invitationId: invitation.id, email: invitation.email },
      testEnv.JWT_SECRET,
    );

    const response = await fetch(
      `http://127.0.0.1:${port}/invitations/respond?token=${token}&status=ACCEPTED`,
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("Invitation accepted");
    expect(prisma.membership.upsert).toHaveBeenCalledWith({
      where: {
        userId_projectId: {
          userId: "user-2",
          projectId: "project-1",
        },
      },
      update: {},
      create: {
        userId: "user-2",
        projectId: "project-1",
      },
    });
    expect(prisma.invitation.update).toHaveBeenCalledWith({
      where: { id: "inv-1" },
      data: { status: "ACCEPTED" },
    });
  });

  test("rejected invitation updates the invite without creating membership", async () => {
    const prisma = createPrismaMock();
    const invitation = {
      id: "inv-2",
      email: "invitee@example.com",
      status: "PENDING",
      invitedUserId: "user-3",
      projectId: "project-2",
    };

    prisma.invitation.findUnique.mockResolvedValue(invitation);
    prisma.invitation.update.mockResolvedValue({
      ...invitation,
      status: "REJECTED",
    });

    const { app } = await loadApp({ prisma });
    const port = await startTestServer(app);
    const token = jwt.sign(
      { invitationId: invitation.id, email: invitation.email },
      testEnv.JWT_SECRET,
    );

    const response = await fetch(
      `http://127.0.0.1:${port}/invitations/respond?token=${token}&status=REJECTED`,
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("Invitation rejected");
    expect(prisma.membership.upsert).not.toHaveBeenCalled();
    expect(prisma.invitation.update).toHaveBeenCalledWith({
      where: { id: "inv-2" },
      data: { status: "REJECTED" },
    });
  });
});
