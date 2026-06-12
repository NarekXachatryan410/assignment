import { GraphQLError } from "graphql";
import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/db.js"
import { requireAuth } from "../utils/auth.js"
import { canManageProject, canViewProject } from "../utils/projectAccess.js"
import { sendInvitationEmail } from "../utils/mailer.js"
import { hash, compare } from "bcrypt"
import jwt from "jsonwebtoken"
import env from "../config/env.js"

const resolvers = {
  Query: {
    users: async (_, __, { user }) => {
      requireAuth(user);
      return prisma.user.findMany({
        orderBy: { fullName: "asc" },
      });
    },

    async me(_, __, { user }) {
      requireAuth(user);
      return prisma.user.findUnique({ where: { id: user.id } });
    },

    async projects(_, __, { user }) {
      requireAuth(user);

      return prisma.project.findMany({
        where: {
          OR: [
            { creatorId: user.id },
            { memberships: { some: { userId: user.id } } },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    },

    async project(_, { id }, { user }) {
      requireAuth(user);

      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new GraphQLError("Project not found");
      }

      const allowed = await canViewProject(user.id, id);
      if (!allowed) {
        throw new GraphQLError("You are not allowed to view this project");
      }

      return project;
    },

    async getProjectDetails(_, { id }, { user }) {
      requireAuth(user);

      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new GraphQLError("Project not found");
      }

      const allowed = await canViewProject(user.id, id);
      if (!allowed) {
        throw new GraphQLError("You are not allowed to view this project");
      }

      return project;
    },

    async verify(_, __, { user }) {
      return !!user;
    },


    async expenses(_, { projectId }, { user }) {
      requireAuth(user);

      if (projectId) {
        const allowed = await canManageProject(user.id, projectId);
        if (!allowed) {
          throw new GraphQLError("You are not allowed to view expenses for this project");
        }

        return prisma.expense.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
        });
      }

      return prisma.expense.findMany({
        orderBy: { createdAt: "desc" },
      });
    },

    async incomes(_, { projectId }, { user }) {
      requireAuth(user);

      if (projectId) {
        const allowed = await canManageProject(user.id, projectId);
        if (!allowed) {
          throw new GraphQLError("You are not allowed to view incomes for this project");
        }

        return prisma.income.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
        });
      }

      return prisma.income.findMany({
        orderBy: { createdAt: "desc" },
      });
    },

    async budgetReport(_, { projectId }, { user }) {
      requireAuth(user);

      const allowed = await canManageProject(user.id, projectId);
      if (!allowed) {
        throw new GraphQLError("You are not allowed to view this project budget");
      }

      const [expenses, incomes] = await Promise.all([
        prisma.expense.findMany({ where: { projectId } }),
        prisma.income.findMany({ where: { projectId } }),
      ]);

      const entries = new Map();

      for (const expense of expenses) {
        const key = expense.name.trim().toLowerCase();
        const current = entries.get(key) || {
          name: expense.name.trim(),
          expenseTotal: 0,
          incomeTotal: 0,
        };

        current.expenseTotal += Number(expense.amount || 0);
        entries.set(key, current);
      }

      for (const income of incomes) {
        const key = income.name.trim().toLowerCase();
        const current = entries.get(key) || {
          name: income.name.trim(),
          expenseTotal: 0,
          incomeTotal: 0,
        };

        current.incomeTotal += Number(income.amount || 0);
        entries.set(key, current);
      }

      const items = Array.from(entries.values())
        .map((entry) => ({
          name: entry.name,
          expenseTotal: Number(entry.expenseTotal.toFixed(2)),
          incomeTotal: Number(entry.incomeTotal.toFixed(2)),
          difference: Number((entry.incomeTotal - entry.expenseTotal).toFixed(2)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const totalExpenses = items.reduce((sum, item) => sum + item.expenseTotal, 0);
      const totalIncomes = items.reduce((sum, item) => sum + item.incomeTotal, 0);

      return {
        projectId,
        totalExpenses: Number(totalExpenses.toFixed(2)),
        totalIncomes: Number(totalIncomes.toFixed(2)),
        netDifference: Number((totalIncomes - totalExpenses).toFixed(2)),
        items,
      };
    },

    async invitations(_, { projectId }, { user }) {
      requireAuth(user);

      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
        });

        if (!project) {
          throw new GraphQLError("Project not found");
        }

        if (project.creatorId !== user.id) {
          throw new GraphQLError("Only project owners can view project invitations");
        }

        return prisma.invitation.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
        });
      }

      return prisma.invitation.findMany({
        where: { invitedUserId: user.id },
        orderBy: { createdAt: "desc" },
      });
    },

    async myInvitations(_, __, { user }) {
      requireAuth(user);

      return prisma.invitation.findMany({
        where: { invitedUserId: user.id },
        orderBy: { createdAt: "desc" },
      });
    },

    async invitation(_, { id }, { user }) {
      requireAuth(user);

      const invitation = await prisma.invitation.findUnique({
        where: { id },
      });

      if (!invitation) {
        throw new GraphQLError("Invitation not found");
      }

      if (invitation.invitedUserId !== user.id) {
        throw new GraphQLError("You are not allowed to view this invitation");
      }

      return invitation;
    },
  },

  Mutation: {
    async createProject(_, { input }, { user }) {
      requireAuth(user)
      const { name = "", location = "" } = input;

      if (!name || !location) {
        throw new GraphQLError("Please fill all the inputs");
      }

      const creatorId = user.id;

      const creator = await prisma.user.findUnique({
        where: { id: creatorId },
      });

      if (!creator) {
        throw new GraphQLError("Creator not found");
      }

      const newProject = await prisma.project.create({
        data: {
          name,
          location,
          creatorId,
        },
      });

      await prisma.membership.create({
        data: {
          userId: creatorId,
          projectId: newProject.id,
        },
      });

      return newProject;
    },

    async updateProject(_, { id, input }, { user }) {
      requireAuth(user);

      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new GraphQLError("Project not found");
      }

      if (project.creatorId !== user.id) {
        throw new GraphQLError("You are not allowed to update this project");
      }

      const { name, location } = input;
      const data = {};

      if (name !== undefined) {
        if (!name.trim()) {
          throw new GraphQLError("Project name cannot be empty");
        }
        data.name = name.trim();
      }

      if (location !== undefined) {
        if (!location.trim()) {
          throw new GraphQLError("Project location cannot be empty");
        }
        data.location = location.trim();
      }

      if (Object.keys(data).length === 0) {
        throw new GraphQLError("No update fields provided");
      }

      return prisma.project.update({
        where: { id },
        data,
      });
    },

    async deleteProject(_, { id }, { user }) {
      requireAuth(user);

      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new GraphQLError("Project not found");
      }

      if (project.creatorId !== user.id) {
        throw new GraphQLError("You are not allowed to delete this project");
      }

      await prisma.membership.deleteMany({
        where: { projectId: id },
      });
      await prisma.invitation.deleteMany({
        where: { projectId: id },
      });
      await prisma.expense.deleteMany({
        where: { projectId: id },
      });
      await prisma.income.deleteMany({
        where: { projectId: id },
      });

      return prisma.project.delete({
        where: { id },
      });
    },

    async createExpense(_, { input }, { user }) {
      requireAuth(user);

      const { name = "", amount, projectId } = input;

      if (!name || amount === undefined || !projectId) {
        throw new GraphQLError("Please fill all the inputs");
      }

      const allowed = await canManageProject(user.id, projectId);
      if (!allowed) {
        throw new GraphQLError("Only project owners and accepted members can create expenses");
      }

      return prisma.expense.create({
        data: {
          name,
          amount,
          projectId,
          createdById: user.id,
        },
      });
    },

    async updateExpense(_, { id, input }, { user }) {
      requireAuth(user);

      const expense = await prisma.expense.findUnique({
        where: { id },
      });

      if (!expense) {
        throw new GraphQLError("Expense not found");
      }

      const project = await prisma.project.findUnique({
        where: { id: expense.projectId },
      });

      if (!project) {
        throw new GraphQLError("Project not found");
      }

      if (expense.createdById !== user.id && project.creatorId !== user.id) {
        throw new GraphQLError("Only the expense creator or project owner can update this expense");
      }

      return prisma.expense.update({
        where: { id },
        data: input,
      });
    },

    async deleteExpense(_, { id }, { user }) {
      requireAuth(user);

      const expense = await prisma.expense.findUnique({
        where: { id },
      });

      if (!expense) {
        throw new GraphQLError("Expense not found");
      }

      const project = await prisma.project.findUnique({
        where: { id: expense.projectId },
      });

      if (!project) {
        throw new GraphQLError("Project not found");
      }

      if (expense.createdById !== user.id && project.creatorId !== user.id) {
        throw new GraphQLError("Only the expense creator or project owner can delete this expense");
      }

      return prisma.expense.delete({
        where: { id },
      });
    },

    async createIncome(_, { input }, { user }) {
      requireAuth(user);

      const { name = "", amount, projectId } = input;

      if (!name || amount === undefined || !projectId) {
        throw new GraphQLError("Please fill all the inputs");
      }

      const allowed = await canManageProject(user.id, projectId);
      if (!allowed) {
        throw new GraphQLError("Only project owners and accepted members can create incomes");
      }

      return prisma.income.create({
        data: {
          name,
          amount,
          projectId,
          createdById: user.id,
        },
      });
    },

    async updateIncome(_, { id, input }, { user }) {
      requireAuth(user);

      const income = await prisma.income.findUnique({
        where: { id },
      });

      if (!income) {
        throw new GraphQLError("Income not found");
      }

      const project = await prisma.project.findUnique({
        where: { id: income.projectId },
      });

      if (!project) {
        throw new GraphQLError("Project not found");
      }

      if (income.createdById !== user.id && project.creatorId !== user.id) {
        throw new GraphQLError("Only the income creator or project owner can update this income");
      }

      return prisma.income.update({
        where: { id },
        data: input,
      });
    },

    async deleteIncome(_, { id }, { user }) {
      requireAuth(user);

      const income = await prisma.income.findUnique({
        where: { id },
      });

      if (!income) {
        throw new GraphQLError("Income not found");
      }

      const project = await prisma.project.findUnique({
        where: { id: income.projectId },
      });

      if (!project) {
        throw new GraphQLError("Project not found");
      }

      if (income.createdById !== user.id && project.creatorId !== user.id) {
        throw new GraphQLError("Only the income creator or project owner can delete this income");
      }

      return prisma.income.delete({
        where: { id },
      });
    },

    async createInvitation(_, { input }, { user }) {
      requireAuth(user);

      const { projectId, email } = input;

      if (!projectId || !email) {
        throw new GraphQLError("Please fill all the inputs");
      }

      const normalizedEmail = email.trim().toLowerCase();

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new GraphQLError("Project not found");
      }

      if (project.creatorId !== user.id) {
        throw new GraphQLError("Only project owners can send invitations");
      }

      const invitedUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!invitedUser) {
        throw new GraphQLError("User with this email does not exist");
      }

      if (invitedUser.id === user.id) {
        throw new GraphQLError("You cannot invite yourself to a project");
      }

      const existingMember = await prisma.membership.findUnique({
        where: {
          userId_projectId: {
            userId: invitedUser.id,
            projectId,
          },
        },
      });

      if (existingMember) {
        throw new GraphQLError("This user is already a member of the project");
      }

      const existing = await prisma.invitation.findFirst({
        where: {
          projectId,
          invitedUserId: invitedUser.id,
          status: "PENDING",
        },
      });

      if (existing) {
        throw new GraphQLError("This user already has a pending invitation for this project");
      }

      let invitation;

      try {
        invitation = await prisma.$transaction(async (tx) => {
          const current = await tx.invitation.findFirst({
            where: {
              projectId,
              invitedUserId: invitedUser.id,
              status: "PENDING",
            },
          });

          if (current) {
            throw new GraphQLError("This user already has a pending invitation for this project");
          }

          return tx.invitation.create({
            data: {
              projectId,
              email: normalizedEmail,
              invitedUserId: invitedUser.id,
              status: "PENDING",
            },
          });
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new GraphQLError("This user already has a pending invitation for this project");
        }

        throw error;
      }

      try {
        await sendInvitationEmail({
          to: normalizedEmail,
          projectName: project.name,
          inviterName: user.fullName || user.username || "A project owner",
          invitationId: invitation.id,
        });
      } catch (mailError) {
        await prisma.invitation.delete({
          where: { id: invitation.id },
        });
        throw new GraphQLError(
          `Invitation was created, but the email could not be sent: ${mailError.message}`,
        );
      }

      return invitation;
    },

    async respondToInvitation(_, { id, status }, { user }) {
      requireAuth(user);

      return prisma.$transaction(async (tx) => {
        const invitation = await tx.invitation.findUnique({
          where: { id },
        });

        if (!invitation) {
          throw new GraphQLError("Invitation not found");
        }

        if (invitation.invitedUserId !== user.id) {
          throw new GraphQLError("You are not allowed to respond to this invitation");
        }

        if (invitation.status !== "PENDING") {
          return invitation;
        }

        if (status === "ACCEPTED") {
          await tx.membership.upsert({
            where: {
              userId_projectId: {
                userId: user.id,
                projectId: invitation.projectId,
              },
            },
            update: {},
            create: {
              userId: user.id,
              projectId: invitation.projectId,
            },
          });
        }

        return tx.invitation.update({
          where: { id },
          data: { status },
        });
      });
    },

    async createUser(_, { input }) {
        const {
          fullName = "",
          email = "",
          username = "",
          password = "",
        } = input;
        if (!fullName || !email || !username || !password) {
          throw new GraphQLError("Please fill all the inputs");
        }

        if(!email.includes("@")) {
          throw new GraphQLError("Incorrect email format")
        }

        if(password.length < 8) {
          throw new GraphQLError("Password must be at least 8 characters")
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim().toLowerCase();

        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: normalizedEmail },
              { username: normalizedUsername },
            ],
          },
        });

        if (existingUser) {
          if (existingUser.email === normalizedEmail) {
            throw new GraphQLError("This email is already registered");
          }

          if (existingUser.username === normalizedUsername) {
            throw new GraphQLError("This username is already taken");
          }
        }

        const hashed = await hash(password, 10);

        try {
          const newUser = await prisma.user.create({
            data: {
              fullName,
              email: normalizedEmail,
              username: normalizedUsername,
              password: hashed,
            },
          });

          return newUser;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            throw new GraphQLError("Email or username already exists");
          }

          throw error;
        }
  
    },

    async login(_, { input }, { res }) {
        const {
          emailOrUsername = "",
          email = "",
          password = "",
        } = input || {};

        const identifier = (emailOrUsername || email).trim().toLowerCase();

        if (!identifier || !password) {
          throw new GraphQLError("Please fill all the inputs");
        }

        const found = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { username: identifier },
            ],
          },
        });

        if (!found) {
          throw new GraphQLError("Incorrect credentials");
        }

        const isCorrect = await compare(password, found.password);
        if (!isCorrect) {
          throw new GraphQLError("Incorrect credentials");
        }

        const token = jwt.sign(
          {
            id: found.id,
            fullName: found.fullName,
            username: found.username,
            email: found.email,
          },
          env.JWT_SECRET,
          { expiresIn: "24h" },
        );

        res.cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        return "Logged in successfully"
      },

  },

  // --- ADDED RELATIONSHIP RESOLVERS HERE ---
  Project: {
    creator: async (parent) => {
      return prisma.user.findUnique({
        where: { id: parent.creatorId },
      });
    },
    memberships: async (parent) => {
      return prisma.membership.findMany({
        where: { projectId: parent.id },
      });
    },
    invitations: async (parent) => {
      return prisma.invitation.findMany({
        where: { projectId: parent.id },
      });
    },
    expenses: async (parent) => {
      return prisma.expense.findMany({
        where: { projectId: parent.id },
      });
    },
    incomes: async (parent) => {
      return prisma.income.findMany({
        where: { projectId: parent.id },
      });
    },
  },

  Invitation: {
    project: async (parent) => {
      return prisma.project.findUnique({
        where: { id: parent.projectId },
      });
    },
    invitedUser: async (parent) => {
      return prisma.user.findUnique({
        where: { id: parent.invitedUserId },
      });
    },
  },

  Membership: {
    user: async (parent) => {
      return prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
    project: async (parent) => {
      return prisma.project.findUnique({
        where: { id: parent.projectId },
      });
    },
  },

  Expense: {
    project: async (parent) => {
      return prisma.project.findUnique({
        where: { id: parent.projectId },
      });
    },
    createdBy: async (parent) => {
      return prisma.user.findUnique({
        where: { id: parent.createdById },
      });
    },
    createdById: async (parent) => {
      return parent.createdById;
    },
  },

  Income: {
    project: async (parent) => {
      return prisma.project.findUnique({
        where: { id: parent.projectId },
      });
    },
    createdBy: async (parent) => {
      return prisma.user.findUnique({
        where: { id: parent.createdById },
      });
    },
    createdById: async (parent) => {
      return parent.createdById;
    },
  },

};

export default resolvers;
