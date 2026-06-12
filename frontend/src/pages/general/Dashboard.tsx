import { useEffect, useState } from "react";
import axios from "axios";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import FolderIcon from "@mui/icons-material/Folder";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import EmailIcon from "@mui/icons-material/Email";

import { API_URL } from "../../api/api";
import { useNavigate } from "react-router-dom";

type Project = {
  id: string;
  name: string;
  location: string;
  creator: { id: string };
};

type UserInvitation = {
  id: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  project: {
    id: string;
    name: string;
    location: string;
  };
};

type CurrentUser = {
  id: string;
  fullName: string;
  username: string;
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

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", location: "" });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            query DashboardData {
              me {
                id
                fullName
                username
              }
              projects {
                id
                name
                location
                creator {
                  id
                }
              }
              myInvitations {
                id
                email
                status
                project {
                  id
                  name
                  location
                }
              }
            }
          `,
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      setCurrentUser(response.data.data.me);
      setProjects(response.data.data.projects || []);
      setInvitations(response.data.data.myInvitations || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!form.name.trim() || !form.location.trim()) {
      setActionError("Please fill in both project name and location.");
      return;
    }

    try {
      setCreating(true);
      setActionError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation CreateProject($input: CreateProjectInput!) {
              createProject(input: $input) {
                id
                name
                location
                creator {
                  id
                }
              }
            }
          `,
          variables: {
            input: {
              name: form.name.trim(),
              location: form.location.trim(),
            },
          },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      setForm({ name: "", location: "" });
      setOpenCreateModal(false);
      await fetchDashboardData();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to create project",
      );
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setForm({ name: project.name, location: project.location });
    setActionError("");
    setOpenEditModal(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    if (!form.name.trim() || !form.location.trim()) {
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
            id: editingProject.id,
            input: {
              name: form.name.trim(),
              location: form.location.trim(),
            },
          },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      setOpenEditModal(false);
      setEditingProject(null);
      setForm({ name: "", location: "" });
      await fetchDashboardData();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update project",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?",
    );

    if (!confirmed) return;

    try {
      setActionError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation DeleteProject($projectId: ID!) {
              deleteProject(id: $projectId) {
                id
              }
            }
          `,
          variables: { projectId },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete project",
      );
    }
  };

  const handleRespondInvitation = async (
    invitationId: string,
    accept: boolean,
  ) => {
    try {
      setRespondingId(invitationId);
      setActionError("");

      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation RespondToInvitation($id: ID!, $status: InvitationStatus!) {
              respondToInvitation(id: $id, status: $status) {
                id
                status
              }
            }
          `,
          variables: {
            id: invitationId,
            status: accept ? "ACCEPTED" : "REJECTED",
          },
        },
        { withCredentials: true },
      );

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      await fetchDashboardData();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to respond to invitation",
      );
    } finally {
      setRespondingId(null);
    }
  };

  const pendingInvitations = invitations.filter(
    (invite) => invite.status === "PENDING",
  );

  const userInitial =
    currentUser?.fullName?.charAt(0)?.toUpperCase() ||
    currentUser?.username?.charAt(0)?.toUpperCase() ||
    "U";

  const isOwner = (project: Project) =>
    currentUser?.id === project.creator.id;

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
          opacity: 0.4,
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
          opacity: 0.3,
        }}
      />

      <Box
        sx={{
          px: 5,
          py: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Typography fontWeight={900} fontSize={20}>
          Project Manager
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          {currentUser && (
            <Typography sx={{ opacity: 0.8, display: { xs: "none", sm: "block" } }}>
              {currentUser.fullName}
            </Typography>
          )}
          <Avatar sx={{ bgcolor: "#8b5cf6" }}>{userInitial}</Avatar>
        </Stack>
      </Box>

      <Box sx={{ p: 5, position: "relative" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
          mb={4}
        >
          <Box>
            <Typography variant="h3" fontWeight={900}>
              Your Projects
            </Typography>
            <Typography sx={{ opacity: 0.7, mt: 1 }}>
              Manage everything in one place
            </Typography>
          </Box>

          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              setActionError("");
              setForm({ name: "", location: "" });
              setOpenCreateModal(true);
            }}
            sx={{
              height: 48,
              borderRadius: 3,
              px: 3,
              fontWeight: 700,
              background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
              color: "white",
            }}
          >
            Create Project
          </Button>
        </Stack>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
            <CircularProgress sx={{ color: "#8b5cf6" }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {actionError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setActionError("")}>
            {actionError}
          </Alert>
        )}

        {!loading && pendingInvitations.length > 0 && (
          <Card
            sx={{
              mb: 4,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(139,92,246,0.35)",
              borderRadius: 4,
              color: "white",
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                <EmailIcon sx={{ color: "#a78bfa" }} />
                <Typography variant="h6" fontWeight={700}>
                  Pending Invitations
                </Typography>
              </Stack>

              <Stack spacing={2}>
                {pendingInvitations.map((invite) => (
                  <Box
                    key={invite.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      p: 2,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700}>{invite.project.name}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        {invite.project.location}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        disabled={respondingId === invite.id}
                        onClick={() => handleRespondInvitation(invite.id, true)}
                        sx={{
                          color: "#4ade80",
                          background: "rgba(74,222,128,0.1)",
                        }}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={respondingId === invite.id}
                        onClick={() => handleRespondInvitation(invite.id, false)}
                        sx={{
                          color: "#f87171",
                          background: "rgba(248,113,113,0.1)",
                        }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {!loading && projects.length === 0 && (
          <Box sx={{ textAlign: "center", mt: 10, opacity: 0.7 }}>
            <Typography variant="h5">No projects yet</Typography>
            <Typography sx={{ mt: 1 }}>
              Create your first project to get started
            </Typography>
          </Box>
        )}

        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid
              key={project.id}
              size={{ xs: 12, md: 6, lg: 4 }}
              onClick={() => navigate("/dashboard/projects/" + project.id)}
            >
              <Card
                sx={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 4,
                  transition: "0.25s",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    borderColor: "#8b5cf6",
                  },
                }}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        sx={{
                          background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
                        }}
                      >
                        <FolderIcon />
                      </Avatar>

                      <Box>
                        <Typography fontWeight={800}>{project.name}</Typography>
                        <Typography sx={{ opacity: 0.7 }}>
                          {project.location}
                        </Typography>
                        {!isOwner(project) && (
                          <Chip
                            label="Member"
                            size="small"
                            sx={{ mt: 1, color: "white", opacity: 0.7 }}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Stack>

                    {isOwner(project) && (
                      <Stack direction="row">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(project);
                          }}
                          sx={{
                            color: "#a78bfa",
                            "&:hover": {
                              backgroundColor: "rgba(167,139,250,0.15)",
                            },
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          sx={{
                            color: "#ef4444",
                            "&:hover": {
                              backgroundColor: "rgba(239,68,68,0.15)",
                            },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    )}
                  </Stack>

                  <Box
                    sx={{
                      mt: 3,
                      height: 1,
                      background: "rgba(255,255,255,.08)",
                    }}
                  />

                  <Typography sx={{ mt: 2, opacity: 0.7 }}>
                    Click to open project →
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog
          open={openCreateModal}
          onClose={() => setOpenCreateModal(false)}
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
          <DialogTitle sx={{ fontWeight: 800 }}>Create New Project</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Project Name"
                fullWidth
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                sx={textFieldSx}
              />
              <TextField
                label="Location"
                fullWidth
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                sx={textFieldSx}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => setOpenCreateModal(false)}
              sx={{ color: "white", borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={creating}
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
              {creating ? "Creating..." : "Create Project"}
            </Button>
          </DialogActions>
        </Dialog>

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
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                sx={textFieldSx}
              />
              <TextField
                label="Location"
                fullWidth
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
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
      </Box>
    </Box>
  );
}
