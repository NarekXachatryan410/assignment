const typeDefs = `
    scalar DateTime

    enum InvitationStatus {
        PENDING
        ACCEPTED
        REJECTED
    }

    type User {
        id: ID!
        fullName: String!
        username: String!
        email: String!
        projects: [Project!]!
        invitations: [Invitation!]!
        sentExpenses: [Expense!]!
        sentIncomes: [Income!]!
        memberships: [Membership!]!
        createdAt: DateTime!
    }

    type Project {
        id: ID!
        name: String!
        location: String!
        creator: User!
        memberships: [Membership!]!
        invitations: [Invitation!]!
        expenses: [Expense!]!
        incomes: [Income!]!
        createdAt: DateTime!
    }

    type Membership {
        id: ID!
        user: User!
        project: Project!
        joinedAt: DateTime!
    }

    type Invitation {
        id: ID!
        project: Project!
        email: String!
        invitedUser: User!
        status: InvitationStatus!
        createdAt: DateTime!
    }

    type Expense {
        id: ID!
        name: String!
        amount: Float!
        project: Project!
        createdBy: User!
        createdAt: DateTime!
    }



    type Income {
        id: ID!
        name: String!
        amount: Float!
        project: Project!
        createdBy: User!
        createdAt: DateTime!
    }



    type BudgetEntry {
        name: String!
        expenseTotal: Float!
        incomeTotal: Float!
        difference: Float!
    }

    type BudgetReport {
        projectId: ID!
        totalExpenses: Float!
        totalIncomes: Float!
        netDifference: Float!
        items: [BudgetEntry!]!
    }

    input CreateProjectInput {
        name: String!
        location: String!
    }

    input UpdateProjectInput {
        name: String
        location: String
    }

    input CreateExpenseInput {
        name: String!
        amount: Float!
        projectId: ID!
    }

    input UpdateExpenseInput {
        name: String
        amount: Float
    }

    input UpdateIncomeInput {
        name: String
        amount: Float
    }

    input CreateIncomeInput {
        name: String!
        amount: Float!
        projectId: ID!
    }

    input CreateInvitationInput {
        projectId: ID!
        email: String!
    }

    input CreateUserInput {
        fullName: String
        email: String
        username: String
        password: String
    }

    input LoginInput {
        emailOrUsername: String
        email: String
        password: String
    }

    type Query {
        users: [User!]!
        user(id: ID!): User
        me: User
        projects: [Project!]!
        project(id: ID!): Project
        getProjectDetails(id: ID!): Project!
        invitations(projectId: ID): [Invitation!]!
        myInvitations: [Invitation!]!
        invitation(id: ID!): Invitation
        expenses(projectId: ID): [Expense!]!
        incomes(projectId: ID): [Income!]!
        budgetReport(projectId: ID!): BudgetReport!
        verify: Boolean!
        }
        
        
        type Mutation {
        createUser(input: CreateUserInput!): User!
        login(input: LoginInput): String
        createProject(input: CreateProjectInput!): Project!
        updateProject(id: ID!, input: UpdateProjectInput!): Project!
        deleteProject(id: ID!): Project!
        createExpense(input: CreateExpenseInput!): Expense!
        updateExpense(id: ID!, input: UpdateExpenseInput!): Expense!
        deleteExpense(id: ID!): Expense!
        createIncome(input: CreateIncomeInput!): Income!
        updateIncome(id: ID!, input: UpdateIncomeInput!): Income!
        deleteIncome(id: ID!): Income!
        createInvitation(input: CreateInvitationInput!): Invitation!
        respondToInvitation(id: ID!, status: InvitationStatus!): Invitation!
    }
`;

export { typeDefs };
export default typeDefs;