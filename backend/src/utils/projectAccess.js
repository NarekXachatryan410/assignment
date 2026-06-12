import { prisma } from "../../prisma/db.js";

export async function isProjectOwner(userId, projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { creatorId: true },
  });

  return !!project && project.creatorId === userId;
}

export async function isProjectMember(userId, projectId) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_projectId: { userId, projectId },
    },
  });

  return !!membership;
}

export async function canViewProject(userId, projectId) {
  return (
    (await isProjectOwner(userId, projectId)) ||
    (await isProjectMember(userId, projectId))
  );
}

export async function canManageProject(userId, projectId) {
  return canViewProject(userId, projectId);
}
