import { jest, describe, expect, test } from "@jest/globals";
import { createPrismaMock, loadResolvers } from "./helpers.js";

describe("authentication", () => {
  test("registration creates a user with normalized data and a hashed password", async () => {
    const prisma = createPrismaMock();
    const hash = jest.fn(async () => "hashed-password");
    const createdUser = {
      id: "user-1",
      fullName: "Jane Doe",
      email: "jane@example.com",
      username: "janedoe",
      createdAt: new Date("2026-06-13T00:00:00.000Z"),
    };

    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(createdUser);

    const { resolvers } = await loadResolvers({ prisma, hash });

    const result = await resolvers.Mutation.createUser(null, {
      input: {
        fullName: "Jane Doe",
        email: "  JANE@example.com ",
        username: "  JaneDoe ",
        password: "password123",
      },
    });

    expect(hash).toHaveBeenCalledWith("password123", 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        fullName: "Jane Doe",
        email: "jane@example.com",
        username: "janedoe",
        password: "hashed-password",
      },
    });
    expect(result).toBe(createdUser);
  });

  test("login returns a token and sets the auth cookie", async () => {
    const prisma = createPrismaMock();
    const compare = jest.fn(async () => true);
    const res = { cookie: jest.fn() };

    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      fullName: "Jane Doe",
      username: "janedoe",
      email: "jane@example.com",
      password: "stored-password",
    });

    const { resolvers } = await loadResolvers({ prisma, compare });

    const result = await resolvers.Mutation.login(
      null,
      {
        input: {
          emailOrUsername: "JaneDoe",
          password: "password123",
        },
      },
      { res },
    );

    expect(compare).toHaveBeenCalledWith("password123", "stored-password");
    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
      }),
    );
    expect(result).toBe("Logged in successfully");
  });

  test("protected operations reject unauthenticated access", async () => {
    const prisma = createPrismaMock();
    const { resolvers } = await loadResolvers({ prisma });

    await expect(resolvers.Query.projects(null, {}, { user: null })).rejects.toThrow(
      "Unathorized",
    );
  });
});

describe("invitations", () => {
  test("prevents duplicate active invitations", async () => {
    const prisma = createPrismaMock();
    const sendInvitationEmail = jest.fn();

    prisma.project.findUnique.mockResolvedValue({
      id: "project-1",
      name: "Alpha Project",
      creatorId: "owner-1",
    });
    prisma.user.findUnique.mockResolvedValue({
      id: "invitee-1",
      email: "invitee@example.com",
      username: "invitee",
      fullName: "Invitee",
    });
    prisma.membership.findUnique.mockResolvedValue(null);
    prisma.invitation.findFirst.mockResolvedValue({
      id: "inv-1",
      status: "PENDING",
    });

    const { resolvers } = await loadResolvers({
      prisma,
      sendInvitationEmail,
    });

    await expect(
      resolvers.Mutation.createInvitation(
        null,
        {
          input: {
            projectId: "project-1",
            email: "invitee@example.com",
          },
        },
        { user: { id: "owner-1" } },
      ),
    ).rejects.toThrow(
      "This user already has a pending invitation for this project",
    );

    expect(sendInvitationEmail).not.toHaveBeenCalled();
  });
});
