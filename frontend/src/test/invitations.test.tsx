import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";

import { API_URL } from "../api/api";
import ProjectDetails from "../pages/general/ProjectDetails";

vi.mock("axios");

const mockedAxios = vi.mocked(axios);
const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    useParams: () => ({ id: "project-1" }),
    useNavigate: () => navigateMock,
  };
});

beforeEach(() => {
  mockedAxios.post.mockReset();
  navigateMock.mockReset();
});

function queueResponses(responses: Array<any>) {
  mockedAxios.post.mockImplementation(async () => {
    const next = responses.shift();
    if (!next) {
      throw new Error("Unexpected axios call in test");
    }
    return next;
  });
}

describe("Project invitations", () => {
  test("sends an invitation successfully from the project page", async () => {
    queueResponses([
      {
        data: {
          data: {
            me: { id: "owner-1" },
            project: {
              id: "project-1",
              name: "Alpha",
              location: "Yerevan",
              creator: { id: "owner-1" },
            },
          },
        },
      },
      { data: { data: { expenses: [] } } },
      { data: { data: { incomes: [] } } },
      {
        data: {
          data: {
            budgetReport: {
              projectId: "project-1",
              totalExpenses: 0,
              totalIncomes: 0,
              netDifference: 0,
              items: [],
            },
          },
        },
      },
      { data: { data: { invitations: [] } } },
      {
        data: {
          data: {
            users: [
              {
                id: "user-2",
                fullName: "Invitee Person",
                email: "invitee@example.com",
              },
            ],
          },
        },
      },
      {
        data: {
          data: {
            createInvitation: {
              id: "inv-1",
              email: "invitee@example.com",
              status: "PENDING",
            },
          },
        },
      },
    ]);

    render(<ProjectDetails />);

    const user = userEvent.setup();
    const searchInput = await screen.findByPlaceholderText(
      /search users to invite/i,
    );

    await user.type(searchInput, "invitee");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /invitee person/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /invitee person/i }),
    );

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        API_URL,
        expect.objectContaining({
          query: expect.stringContaining("createInvitation"),
          variables: {
            input: {
              projectId: "project-1",
              email: "invitee@example.com",
            },
          },
        }),
        expect.objectContaining({ withCredentials: true }),
      );
    });

    expect(
      screen.getByText(/invitation sent to invitee@example.com!/i),
    ).toBeInTheDocument();
  });

  test("shows an error when a duplicate active invitation is attempted", async () => {
    queueResponses([
      {
        data: {
          data: {
            me: { id: "owner-1" },
            project: {
              id: "project-1",
              name: "Alpha",
              location: "Yerevan",
              creator: { id: "owner-1" },
            },
          },
        },
      },
      { data: { data: { expenses: [] } } },
      { data: { data: { incomes: [] } } },
      {
        data: {
          data: {
            budgetReport: {
              projectId: "project-1",
              totalExpenses: 0,
              totalIncomes: 0,
              netDifference: 0,
              items: [],
            },
          },
        },
      },
      { data: { data: { invitations: [] } } },
      {
        data: {
          data: {
            users: [
              {
                id: "user-2",
                fullName: "Invitee Person",
                email: "invitee@example.com",
              },
            ],
          },
        },
      },
      {
        data: {
          errors: [
            {
              message:
                "This user already has a pending invitation for this project",
            },
          ],
        },
      },
    ]);

    render(<ProjectDetails />);

    const user = userEvent.setup();
    const searchInput = await screen.findByPlaceholderText(
      /search users to invite/i,
    );

    await user.type(searchInput, "invitee");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /invitee person/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /invitee person/i }),
    );

    expect(
      await screen.findByText(
        /this user already has a pending invitation for this project/i,
      ),
    ).toBeInTheDocument();
  });
});
