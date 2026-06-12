import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Alert,
  Button,
  Avatar,
  TextField,
  Chip,
  IconButton,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FolderIcon from "@mui/icons-material/Folder";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

import { API_URL } from "../../api/api";

type Project = {
  id: string;
  name: string;
  location: string;
  creator: {
    id: string;
  };
};

type Invitation = {
  id: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
};

type UserOption = {
  id: string;
  fullName: string;
  email: string;
};

type Expense = {
  id: string;
  name: string;
  amount: number;
  createdById: string;
  createdAt: string;
};

type Income = {
  id: string;
  name: string;
  amount: number;
  createdById: string;
  createdAt: string;
};

type BudgetEntry = {
  name: string;
  expenseTotal: number;
  incomeTotal: number;
  difference: number;
};

type BudgetReport = {
  projectId: string;
  totalExpenses: number;
  totalIncomes: number;
  netDifference: number;
  items: BudgetEntry[];
};

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 3,
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(139,92,246,0.7)" },
    "&.Mui-focused fieldset": { borderColor: "#8b5cf6" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
};

function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  const timer = useRef<any>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay],
  );
}

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [inputValue, setInputValue] = useState("");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", location: "" });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgetReport, setBudgetReport] = useState<BudgetReport | null>(null);
  const [activeTab, setActiveTab] = useState<"expenses" | "incomes" | "budget">("expenses");

  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [openIncomeModal, setOpenIncomeModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [expenseForm, setExpenseForm] = useState({ name: "", amount: "" });
  const [incomeForm, setIncomeForm] = useState({ name: "", amount: "" });
  const [savingExpense, setSavingExpense] = useState(false);
  const [savingIncome, setSavingIncome] = useState(false);

  const isOwner = project && currentUserId === project.creator.id;

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  const fetchProjectData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            query getProjectDetails($id: ID!) {
              me {
                id
              }
              project(id: $id) {
                id
                name
                location
                creator {
                  id
                }
              }
            }
          `,
          variables: { id },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      const loadedProject = response.data.data.project;
      setProject(loadedProject);
      setCurrentUserId(response.data.data.me?.id || null);

      if (loadedProject && response.data.data.me?.id === loadedProject.creator.id) {
        await fetchInvitations(id);
      } else {
        setInvitations([]);
      }

      await fetchFinancialData(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load project details",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialData = async (projectId: string) => {
    try {
      const [expensesRes, incomesRes, budgetRes] = await Promise.all([
        axios.post(
          API_URL,
          {
            query: `
              query GetExpenses($projectId: ID!) {
                expenses(projectId: $projectId) {
                  id
                  name
                  amount
                  createdById
                  createdAt
                }
              }
            `,
            variables: { projectId },
          },
          { withCredentials: true },
        ),
        axios.post(
          API_URL,
          {
            query: `
              query GetIncomes($projectId: ID!) {
                incomes(projectId: $projectId) {
                  id
                  name
                  amount
                  createdById
                  createdAt
                }
              }
            `,
            variables: { projectId },
          },
          { withCredentials: true },
        ),
        axios.post(
          API_URL,
          {
            query: `
              query GetBudgetReport($projectId: ID!) {
                budgetReport(projectId: $projectId) {
                  projectId
                  totalExpenses
                  totalIncomes
                  netDifference
                  items {
                    name
                    expenseTotal
                    incomeTotal
                    difference
                  }
                }
              }
            `,
            variables: { projectId },
          },
          { withCredentials: true },
        ),
      ]);

      if (!expensesRes.data.errors) {
        setExpenses(expensesRes.data.data.expenses || []);
      }
      if (!incomesRes.data.errors) {
        setIncomes(incomesRes.data.data.incomes || []);
      }
      if (!budgetRes.data.errors) {
        setBudgetReport(budgetRes.data.data.budgetReport);
      }
    } catch (err) {
      console.error("Error fetching financial data:", err);
    }
  };

  const fetchInvitations = async (projectId: string) => {
    const response = await axios.post(
      API_URL,
      {
        query: `
          query ProjectInvitations($projectId: ID!) {
            invitations(projectId: $projectId) {
              id
              email
              status
            }
          }
        `,
        variables: { projectId },
      },
      { withCredentials: true },
    );

    if (!response.data.errors?.length) {
      setInvitations(response.data.data.invitations || []);
    }
  };

  const fetchUserOptions = async (queryText: string) => {
    if (!queryText.trim()) {
      setUserOptions([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await axios.post(
        API_URL,
        {
          query: `
            query searchUsers {
              users {
                id
                fullName
                email
              }
            }
          `,
        },
        { withCredentials: true },
      );

      if (!response.data.errors) {
        const allUsers = response.data.data.users || [];
        const filtered = allUsers.filter(
          (u: UserOption) =>
            u.fullName.toLowerCase().includes(queryText.toLowerCase()) ||
            u.email.toLowerCase().includes(queryText.toLowerCase()),
        );
        setUserOptions(filtered);
      }
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const debouncedFetchUsers = useDebounce(fetchUserOptions, 400);

  const handleSelectUserAndInvite = async (user: UserOption | null) => {
    if (!user || !id) return;

    try {
      setInviteLoading(true);
      setInviteStatus(null);

      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation CreateInvitation($input: CreateInvitationInput!) {
              createInvitation(input: $input) {
                id
                email
                status
              }
            }
          `,
          variables: {
            input: {
              projectId: id,
              email: user.email,
            },
          },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      const newInvite = response.data.data.createInvitation;
      setInvitations((prev) => [newInvite, ...prev]);
      setInputValue("");
      setUserOptions([]);
      setInviteStatus({
        type: "success",
        msg: `Invitation sent to ${newInvite.email}!`,
      });
    } catch (err) {
      setInviteStatus({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to send invitation",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!project) return;

    if (!editForm.name.trim() || !editForm.location.trim()) {
      setActionError("Please fill in both project name and location.");
      return;
    }

    try {
      setUpdating(true);
      setActionError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
              updateProject(id: $id, input: $input) {
                id
                name
                location
              }
            }
          `,
          variables: {
            id: project.id,
            input: {
              name: editForm.name.trim(),
              location: editForm.location.trim(),
            },
          },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      setProject((prev) =>
        prev
          ? {
              ...prev,
              name: response.data.data.updateProject.name,
              location: response.data.data.updateProject.location,
            }
          : prev,
      );
      setOpenEditModal(false);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update project",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setActionError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation DeleteProject($id: ID!) {
              deleteProject(id: $id) {
                id
              }
            }
          `,
          variables: { id: project.id },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      navigate("/dashboard");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete project",
      );
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = () => {
    if (!project) return;
    setEditForm({ name: project.name, location: project.location });
    setActionError("");
    setOpenEditModal(true);
  };

  const handleCreateExpense = async () => {
    if (!id || !expenseForm.name.trim() || !expenseForm.amount) {
      setActionError("Please fill in both expense name and amount.");
      return;
    }

    try {
      setSavingExpense(true);
      setActionError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation CreateExpense($input: CreateExpenseInput!) {
              createExpense(input: $input) {
                id
                name
                amount
                createdById
                createdAt
              }
            }
          `,
          variables: {
            input: {
              name: expenseForm.name.trim(),
              amount: parseFloat(expenseForm.amount),
              projectId: id,
            },
          },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      setExpenseForm({ name: "", amount: "" });
      setOpenExpenseModal(false);
      await fetchFinancialData(id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to create expense",
      );
    } finally {
      setSavingExpense(false);
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;

    if (!expenseForm.name.trim() || !expenseForm.amount) {
      setActionError("Please fill in both expense name and amount.");
      return;
    }

    try {
      setSavingExpense(true);
      setActionError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation UpdateExpense($id: ID!, $input: UpdateExpenseInput!) {
              updateExpense(id: $id, input: $input) {
                id
                name
                amount
                createdById
                createdAt
              }
            }
          `,
          variables: {
            id: editingExpense.id,
            input: {
              name: expenseForm.name.trim(),
              amount: parseFloat(expenseForm.amount),
            },
          },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      setExpenseForm({ name: "", amount: "" });
      setEditingExpense(null);
      setOpenExpenseModal(false);
      await fetchFinancialData(id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update expense",
      );
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?",
    );

    if (!confirmed) return;

    try {
      setActionError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation DeleteExpense($id: ID!) {
              deleteExpense(id: $id) {
                id
              }
            }
          `,
          variables: { id: expenseId },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      await fetchFinancialData(id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete expense",
      );
    }
  };

  const handleCreateIncome = async () => {
    if (!id || !incomeForm.name.trim() || !incomeForm.amount) {
      setActionError("Please fill in both income name and amount.");
      return;
    }

    try {
      setSavingIncome(true);
      setActionError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation CreateIncome($input: CreateIncomeInput!) {
              createIncome(input: $input) {
                id
                name
                amount
                createdById
                createdAt
              }
            }
          `,
          variables: {
            input: {
              name: incomeForm.name.trim(),
              amount: parseFloat(incomeForm.amount),
              projectId: id,
            },
          },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      setIncomeForm({ name: "", amount: "" });
      setOpenIncomeModal(false);
      await fetchFinancialData(id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to create income",
      );
    } finally {
      setSavingIncome(false);
    }
  };

  const handleUpdateIncome = async () => {
    if (!editingIncome) return;

    if (!incomeForm.name.trim() || !incomeForm.amount) {
      setActionError("Please fill in both income name and amount.");
      return;
    }

    try {
      setSavingIncome(true);
      setActionError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation UpdateIncome($id: ID!, $input: UpdateIncomeInput!) {
              updateIncome(id: $id, input: $input) {
                id
                name
                amount
                createdById
                createdAt
              }
            }
          `,
          variables: {
            id: editingIncome.id,
            input: {
              name: incomeForm.name.trim(),
              amount: parseFloat(incomeForm.amount),
            },
          },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      setIncomeForm({ name: "", amount: "" });
      setEditingIncome(null);
      setOpenIncomeModal(false);
      await fetchFinancialData(id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update income",
      );
    } finally {
      setSavingIncome(false);
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this income?",
    );

    if (!confirmed) return;

    try {
      setActionError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation DeleteIncome($id: ID!) {
              deleteIncome(id: $id) {
                id
              }
            }
          `,
          variables: { id: incomeId },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      await fetchFinancialData(id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete income",
      );
    }
  };

  const handleOpenExpenseModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseForm({ name: expense.name, amount: expense.amount.toString() });
    } else {
      setEditingExpense(null);
      setExpenseForm({ name: "", amount: "" });
    }
    setActionError("");
    setOpenExpenseModal(true);
  };

  const handleOpenIncomeModal = (income?: Income) => {
    if (income) {
      setEditingIncome(income);
      setIncomeForm({ name: income.name, amount: income.amount.toString() });
    } else {
      setEditingIncome(null);
      setIncomeForm({ name: "", amount: "" });
    }
    setActionError("");
    setOpenIncomeModal(true);
  };

  const canEditExpense = (expense: Expense) => {
    return currentUserId === expense.createdById || isOwner;
  };

  const canEditIncome = (income: Income) => {
    return currentUserId === income.createdById || isOwner;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "#7c3aed",
          filter: "blur(180px)",
          top: -120,
          left: -120,
          opacity: 0.35,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 450,
          height: 450,
          borderRadius: "50%",
          background: "#06b6d4",
          filter: "blur(180px)",
          bottom: -120,
          right: -80,
          opacity: 0.25,
        }}
      />

      <Box
        sx={{
          px: 4,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(232, 220, 220, 0.08)",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            onClick={() => navigate("/dashboard")}
            startIcon={<ArrowBackIcon />}
            sx={{ color: "white" }}
          >
            Back
          </Button>
          <Typography
            fontWeight={800}
            sx={{ display: { xs: "none", md: "block" } }}
          >
            Project Details
          </Typography>
        </Stack>

        {isOwner && (
          <Box sx={{ width: { xs: "100%", sm: "320px", md: "400px" } }}>
            <Autocomplete
              fullWidth
              size="medium"
              options={userOptions}
              getOptionLabel={(option) =>
                `${option.fullName} (${option.email})`
              }
              filterOptions={(x) => x}
              loading={searchLoading}
              value={null}
              onChange={(_, newValue) => handleSelectUserAndInvite(newValue)}
              inputValue={inputValue}
              onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue);
                debouncedFetchUsers(newInputValue);
              }}
              noOptionsText={
                inputValue.trim() === ""
                  ? "Type user name..."
                  : "No users found"
              }
              disabled={inviteLoading}
              componentsProps={{
                paper: {
                  sx: {
                    background: "#1e293b",
                    color: "#ffffff",
                    border: "2px solid #ffffff",
                    mt: 1,
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                    "& .MuiAutocomplete-option": {
                      fontSize: "0.85rem",
                      color: "#ffffff",
                      '&[aria-selected="true"]': {
                        background: "rgba(255,255,255,0.2)",
                      },
                      "&:hover": { background: "rgba(255,255,255,0.1)" },
                    },
                  },
                },
              }}
              renderInput={(params) => {
                const { InputProps = {}, inputProps, ...textFieldParams } =
                  params;

                return (
                  <TextField
                    {...textFieldParams}
                    variant="outlined"
                    inputProps={{
                      ...inputProps,
                      placeholder: "Search users to invite...",
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        background: "rgba(255, 255, 255, 0.28)",
                        borderRadius: 3,
                        fontSize: "0.85rem",
                        transition: "all 0.2s ease-in-out",
                        "& fieldset": {
                          border: "2px solid #ffffff !important",
                        },
                        "&:hover fieldset": {
                          border: "2px solid #ffffff !important",
                        },
                        "&.Mui-focused fieldset": {
                          border: "2px solid #ffffff !important",
                          boxShadow: "0 0 8px rgba(255, 255, 255, 0.4)",
                        },
                        "& .MuiSvgIcon-root": {
                          color: "#ffffff !important",
                        },
                      },
                      "& .MuiOutlinedInput-input": {
                        color: "#f8fafc !important",
                        WebkitTextFillColor: "#f8fafc",
                        "&::placeholder": {
                          color: "rgba(255, 255, 255, 0.85) !important",
                          opacity: "1 !important",
                          WebkitTextFillColor: "rgba(255, 255, 255, 0.85)",
                        },
                      },
                    }}
                    InputProps={{
                      ...InputProps,
                      endAdornment: (
                        <>
                          {searchLoading || inviteLoading ? (
                            <CircularProgress
                              color="inherit"
                              size={16}
                              sx={{ color: "#ffffff", mr: 1 }}
                            />
                          ) : null}
                          {InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                );
              }}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ p: 5 }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
            <CircularProgress sx={{ color: "#8b5cf6" }} />
          </Box>
        )}

        {inviteStatus && (
          <Alert
            severity={inviteStatus.type}
            onClose={() => setInviteStatus(null)}
            sx={{ maxWidth: 700, mx: "auto", mb: 3 }}
          >
            {inviteStatus.msg}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ maxWidth: 700, mx: "auto", mb: 3 }}>
            {error}
          </Alert>
        )}

        {actionError && (
          <Alert
            severity="error"
            onClose={() => setActionError("")}
            sx={{ maxWidth: 700, mx: "auto", mb: 3 }}
          >
            {actionError}
          </Alert>
        )}

        {!loading && project && (
          <Stack spacing={4} sx={{ maxWidth: 700, mx: "auto" }}>
            <Card
              sx={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 5,
                backdropFilter: "blur(20px)",
                color: "white",
                boxShadow: "0 30px 80px rgba(0,0,0,.4)",
              }}
            >
              <CardContent sx={{ p: 5 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
                      width: 56,
                      height: 56,
                    }}
                  >
                    <FolderIcon />
                  </Avatar>

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" fontWeight={900}>
                      {project.name}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ opacity: 0.7 }}
                    >
                      <LocationOnIcon fontSize="small" />
                      <Typography>{project.location}</Typography>
                    </Stack>
                    {!isOwner && (
                      <Chip
                        label="Member"
                        size="small"
                        sx={{ mt: 1, color: "white", opacity: 0.7 }}
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {isOwner && (
                    <Stack direction="row">
                      <IconButton onClick={openEdit} sx={{ color: "#a78bfa" }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={handleDeleteProject}
                        disabled={deleting}
                        sx={{ color: "#ef4444" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  )}
                </Stack>

                <Box
                  sx={{
                    mt: 4,
                    mb: 3,
                    height: "1px",
                    background: "rgba(255,255,255,.08)",
                  }}
                />
                <Typography sx={{ opacity: 0.7, lineHeight: 1.8 }}>
                  {isOwner
                    ? "You own this project. Invite collaborators, manage details, and track expenses and incomes."
                    : "You are a member of this project. You can view details and manage expenses and incomes."}
                </Typography>
              </CardContent>
            </Card>

            {isOwner && (
              <Card
                sx={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 5,
                  backdropFilter: "blur(20px)",
                  color: "white",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Sent Invitations
                  </Typography>
                  {invitations.length === 0 ? (
                    <Typography variant="body2" sx={{ opacity: 0.5 }}>
                      No invitations sent yet. Use the search bar above to invite
                      users by email.
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {invitations.map((invite) => (
                        <Box
                          key={invite.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: 3,
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <Typography variant="body2">{invite.email}</Typography>
                          <Chip
                            label={invite.status}
                            size="small"
                            color={
                              invite.status === "ACCEPTED"
                                ? "success"
                                : invite.status === "REJECTED"
                                  ? "default"
                                  : "warning"
                            }
                            variant="outlined"
                            sx={{ color: "white", opacity: 0.85 }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            )}

            <Card
              sx={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 5,
                backdropFilter: "blur(20px)",
                color: "white",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" fontWeight={700}>
                    Financial Management
                  </Typography>
                  {activeTab !== "budget" && (
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => {
                        if (activeTab === "expenses") {
                          handleOpenExpenseModal();
                        } else {
                          handleOpenIncomeModal();
                        }
                      }}
                      sx={{
                        height: 36,
                        borderRadius: 2,
                        px: 2,
                        fontWeight: 600,
                        background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
                        color: "white",
                      }}
                    >
                      Add {activeTab === "expenses" ? "Expense" : "Income"}
                    </Button>
                  )}
                </Box>

                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  sx={{
                    mb: 3,
                    "& .MuiTab-root": {
                      color: "rgba(255,255,255,0.6)",
                      fontWeight: 600,
                      textTransform: "none",
                    },
                    "& .MuiTab-root.Mui-selected": {
                      color: "#8b5cf6",
                    },
                    "& .MuiTabs-indicator": {
                      backgroundColor: "#8b5cf6",
                    },
                  }}
                >
                  <Tab label="Expenses" value="expenses" />
                  <Tab label="Incomes" value="incomes" />
                  <Tab label="Budget Report" value="budget" />
                </Tabs>

                {activeTab === "expenses" && (
                  <Box>
                    {expenses.length === 0 ? (
                      <Box
                        sx={{
                          textAlign: "center",
                          py: 6,
                          opacity: 0.5,
                        }}
                      >
                        <Typography variant="body1">
                          No expenses recorded yet
                        </Typography>
                      </Box>
                    ) : (
                      <TableContainer
                        component={Paper}
                        sx={{
                          background: "transparent",
                          boxShadow: "none",
                        }}
                      >
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Name
                              </TableCell>
                              <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Amount
                              </TableCell>
                              <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Actions
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {expenses.map((expense) => (
                              <TableRow
                                key={expense.id}
                                sx={{
                                  "&:hover": {
                                    background: "rgba(255,255,255,0.03)",
                                  },
                                }}
                              >
                                <TableCell sx={{ color: "white" }}>
                                  {expense.name}
                                </TableCell>
                                <TableCell sx={{ color: "#ef4444", fontWeight: 600 }}>
                                  ${expense.amount.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {canEditExpense(expense) && (
                                    <Stack direction="row" spacing={1}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenExpenseModal(expense)}
                                        sx={{ color: "#a78bfa" }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteExpense(expense.id)}
                                        sx={{ color: "#ef4444" }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {activeTab === "incomes" && (
                  <Box>
                    {incomes.length === 0 ? (
                      <Box
                        sx={{
                          textAlign: "center",
                          py: 6,
                          opacity: 0.5,
                        }}
                      >
                        <Typography variant="body1">
                          No incomes recorded yet
                        </Typography>
                      </Box>
                    ) : (
                      <TableContainer
                        component={Paper}
                        sx={{
                          background: "transparent",
                          boxShadow: "none",
                        }}
                      >
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Name
                              </TableCell>
                              <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Amount
                              </TableCell>
                              <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Actions
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {incomes.map((income) => (
                              <TableRow
                                key={income.id}
                                sx={{
                                  "&:hover": {
                                    background: "rgba(255,255,255,0.03)",
                                  },
                                }}
                              >
                                <TableCell sx={{ color: "white" }}>
                                  {income.name}
                                </TableCell>
                                <TableCell sx={{ color: "#22c55e", fontWeight: 600 }}>
                                  ${income.amount.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {canEditIncome(income) && (
                                    <Stack direction="row" spacing={1}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenIncomeModal(income)}
                                        sx={{ color: "#a78bfa" }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteIncome(income.id)}
                                        sx={{ color: "#ef4444" }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {activeTab === "budget" && budgetReport && (
                  <Box>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Card
                          sx={{
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: 3,
                            p: 3,
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <TrendingDownIcon sx={{ color: "#ef4444", fontSize: 32 }} />
                            <Box>
                              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                Total Expenses
                              </Typography>
                              <Typography variant="h5" fontWeight={700} sx={{ color: "#ef4444" }}>
                                ${budgetReport.totalExpenses.toFixed(2)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Card
                          sx={{
                            background: "rgba(34,197,94,0.1)",
                            border: "1px solid rgba(34,197,94,0.3)",
                            borderRadius: 3,
                            p: 3,
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <TrendingUpIcon sx={{ color: "#22c55e", fontSize: 32 }} />
                            <Box>
                              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                Total Incomes
                              </Typography>
                              <Typography variant="h5" fontWeight={700} sx={{ color: "#22c55e" }}>
                                ${budgetReport.totalIncomes.toFixed(2)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Card
                          sx={{
                            background: budgetReport.netDifference >= 0
                              ? "rgba(34,197,94,0.1)"
                              : "rgba(239,68,68,0.1)",
                            border: budgetReport.netDifference >= 0
                              ? "1px solid rgba(34,197,94,0.3)"
                              : "1px solid rgba(239,68,68,0.3)",
                            borderRadius: 3,
                            p: 3,
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <AccountBalanceIcon
                              sx={{
                                color: budgetReport.netDifference >= 0 ? "#22c55e" : "#ef4444",
                                fontSize: 32,
                              }}
                            />
                            <Box>
                              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                Net Difference
                              </Typography>
                              <Typography
                                variant="h5"
                                fontWeight={700}
                                sx={{
                                  color: budgetReport.netDifference >= 0 ? "#22c55e" : "#ef4444",
                                }}
                              >
                                ${budgetReport.netDifference.toFixed(2)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Card>
                      </Grid>
                    </Grid>

                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      Budget Breakdown
                    </Typography>

                    {budgetReport.items.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 4, opacity: 0.5 }}>
                        <Typography variant="body1">No budget data available</Typography>
                      </Box>
                    ) : (
                      <TableContainer
                        component={Paper}
                        sx={{
                          background: "transparent",
                          boxShadow: "none",
                        }}
                      >
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Category
                              </TableCell>
                              <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Expenses
                              </TableCell>
                              <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Incomes
                              </TableCell>
                              <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                                Difference
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {budgetReport.items.map((item, index) => (
                              <TableRow
                                key={index}
                                sx={{
                                  "&:hover": {
                                    background: "rgba(255,255,255,0.03)",
                                  },
                                }}
                              >
                                <TableCell sx={{ color: "white", fontWeight: 500 }}>
                                  {item.name}
                                </TableCell>
                                <TableCell sx={{ color: "#ef4444", fontWeight: 600 }}>
                                  ${item.expenseTotal.toFixed(2)}
                                </TableCell>
                                <TableCell sx={{ color: "#22c55e", fontWeight: 600 }}>
                                  ${item.incomeTotal.toFixed(2)}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    color: item.difference >= 0 ? "#22c55e" : "#ef4444",
                                    fontWeight: 600,
                                  }}
                                >
                                  ${item.difference.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>

      <Dialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        slotProps={{
          paper: {
            sx: {
              background: "rgba(15, 23, 42, 0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4,
              color: "white",
              width: "100%",
              maxWidth: 460,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Project</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Project Name"
              fullWidth
              value={editForm.name}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, name: e.target.value }))
              }
              sx={textFieldSx}
            />
            <TextField
              label="Location"
              fullWidth
              value={editForm.location}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, location: e.target.value }))
              }
              sx={textFieldSx}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenEditModal(false)}
            sx={{ color: "white", borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateProject}
            disabled={updating}
            sx={{
              borderRadius: 2,
              px: 2.5,
              background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
              color: "white",
              fontWeight: 700,
              "&:hover": {
                background: "linear-gradient(135deg,#7c3aed,#0891b2)",
              },
            }}
          >
            {updating ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openExpenseModal}
        onClose={() => setOpenExpenseModal(false)}
        slotProps={{
          paper: {
            sx: {
              background: "rgba(15, 23, 42, 0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4,
              color: "white",
              width: "100%",
              maxWidth: 460,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingExpense ? "Edit Expense" : "Add Expense"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Expense Name"
              fullWidth
              value={expenseForm.name}
              onChange={(e) =>
                setExpenseForm((prev) => ({ ...prev, name: e.target.value }))
              }
              sx={textFieldSx}
            />
            <TextField
              label="Amount"
              fullWidth
              type="number"
              value={expenseForm.amount}
              onChange={(e) =>
                setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))
              }
              sx={textFieldSx}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenExpenseModal(false)}
            sx={{ color: "white", borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={editingExpense ? handleUpdateExpense : handleCreateExpense}
            disabled={savingExpense}
            sx={{
              borderRadius: 2,
              px: 2.5,
              background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
              color: "white",
              fontWeight: 700,
              "&:hover": {
                background: "linear-gradient(135deg,#7c3aed,#0891b2)",
              },
            }}
          >
            {savingExpense ? "Saving..." : editingExpense ? "Update" : "Add Expense"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openIncomeModal}
        onClose={() => setOpenIncomeModal(false)}
        slotProps={{
          paper: {
            sx: {
              background: "rgba(15, 23, 42, 0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4,
              color: "white",
              width: "100%",
              maxWidth: 460,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingIncome ? "Edit Income" : "Add Income"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Income Name"
              fullWidth
              value={incomeForm.name}
              onChange={(e) =>
                setIncomeForm((prev) => ({ ...prev, name: e.target.value }))
              }
              sx={textFieldSx}
            />
            <TextField
              label="Amount"
              fullWidth
              type="number"
              value={incomeForm.amount}
              onChange={(e) =>
                setIncomeForm((prev) => ({ ...prev, amount: e.target.value }))
              }
              sx={textFieldSx}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenIncomeModal(false)}
            sx={{ color: "white", borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={editingIncome ? handleUpdateIncome : handleCreateIncome}
            disabled={savingIncome}
            sx={{
              borderRadius: 2,
              px: 2.5,
              background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
              color: "white",
              fontWeight: 700,
              "&:hover": {
                background: "linear-gradient(135deg,#7c3aed,#0891b2)",
              },
            }}
          >
            {savingIncome ? "Saving..." : editingIncome ? "Update" : "Add Income"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
