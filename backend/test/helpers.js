import { jest } from "@jest/globals";

export function createPrismaMock() {
  const prisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    membership: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    invitation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    expense: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
    income: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  prisma.$transaction = jest.fn(async (callback) => callback(prisma));

  return prisma;
}

export const testEnv = {
  JWT_SECRET: "test-secret",
  EMAIL_HOST: "smtp.gmail.com",
  EMAIL_PORT: 465,
  EMAIL_USER: "sender@gmail.com",
  EMAIL_PASS: "test-password",
  EMAIL_FROM: "sender@gmail.com",
  FRONTEND_URL: "http://127.0.0.1:5173",
  BACKEND_URL: "http://127.0.0.1:4000",
};

export async function loadResolvers({
  prisma,
  sendInvitationEmail = jest.fn(),
  hash = jest.fn(async () => "hashed-password"),
  compare = jest.fn(async () => true),
}) {
  jest.resetModules();

  await jest.unstable_mockModule("../prisma/db.js", () => ({
    prisma,
    default: prisma,
  }));

  await jest.unstable_mockModule("../src/config/env.js", () => ({
    default: testEnv,
  }));

  await jest.unstable_mockModule("../src/utils/mailer.js", () => ({
    sendInvitationEmail,
  }));

  await jest.unstable_mockModule("bcrypt", () => ({
    hash,
    compare,
  }));

  const { default: resolvers } = await import("../src/schema/resolvers.js");

  return { resolvers, sendInvitationEmail, hash, compare };
}

export async function loadApp({ prisma }) {
  jest.resetModules();

  await jest.unstable_mockModule("../prisma/db.js", () => ({
    prisma,
    default: prisma,
  }));

  await jest.unstable_mockModule("../src/config/env.js", () => ({
    default: testEnv,
  }));

  await jest.unstable_mockModule("../src/utils/mailer.js", () => ({
    sendInvitationEmail: jest.fn(),
  }));

  const { app } = await import("../src/app.js");

  return { app };
}
