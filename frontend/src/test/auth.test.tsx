import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

import Signup from "../pages/auth/Signup";
import Login from "../pages/auth/Login";
import { API_URL } from "../api/api";

vi.mock("axios");
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const mockedAxios = vi.mocked(axios);

beforeEach(() => {
  mockedAxios.post.mockReset();
  navigateMock.mockReset();
});

describe("Signup", () => {
  test("registers a new user successfully", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        data: {
          createUser: {
            id: "user-1",
            fullName: "Jane Doe",
            email: "jane@example.com",
            username: "janedoe",
          },
        },
      },
    });

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/username/i), "janedoe");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "password123",
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        API_URL,
        expect.objectContaining({
          query: expect.stringContaining("createUser"),
          variables: {
            input: {
              fullName: "Jane Doe",
              email: "jane@example.com",
              username: "janedoe",
              password: "password123",
            },
          },
        }),
      );
    });

    expect(
      screen.getByText(/account created successfully/i),
    ).toBeInTheDocument();
  });
});

describe("Login", () => {
  test("logs in and navigates to the dashboard", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        data: {
          login: "Logged in successfully",
        },
      },
    });

    render(<Login />);

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/email or username/i),
      "janedoe",
    );
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        API_URL,
        expect.objectContaining({
          query: expect.stringContaining("login"),
          variables: {
            input: {
              emailOrUsername: "janedoe",
              password: "password123",
            },
          },
        }),
        expect.objectContaining({ withCredentials: true }),
      );
    });

    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });
});

describe("Protected route", () => {
  test("renders the protected content when authenticated", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        data: {
          verify: true,
        },
      },
    });

    const ProtectedRoute = (
      await import("../components/ProtectedRoute")
    ).default;

    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>Secret Area</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/secret area/i)).toBeInTheDocument();
  });

  test("redirects unauthenticated users to login", async () => {
    mockedAxios.post.mockRejectedValue(new Error("Unauthorized"));

    const ProtectedRoute = (
      await import("../components/ProtectedRoute")
    ).default;

    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <div>Secret Area</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/login page/i)).toBeInTheDocument();
  });
});
