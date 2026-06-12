import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { createElement } from "react";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

function mockWrapper(tag = "div") {
  return ({ children, component, ...props }: any) =>
    createElement(component || tag, props, children);
}

function mockTextField() {
  return ({
    label,
    value,
    onChange,
    type = "text",
    disabled,
    inputProps = {},
    ...props
  }: any) =>
    createElement(
      "label",
      null,
      createElement("span", null, label),
      createElement("input", {
        "aria-label": label,
        value: value ?? "",
        onChange: onChange || inputProps.onChange,
        type,
        disabled,
        placeholder: inputProps.placeholder,
        ...props,
      }),
    );
}

function mockButton() {
  return ({ children, loading, disabled, ...props }: any) =>
    createElement(
      "button",
      {
        disabled: disabled || loading,
        ...props,
      },
      loading ? "Loading" : children,
    );
}

function mockAlert() {
  return ({ children, ...props }: any) =>
    createElement("div", { role: "alert", ...props }, children);
}

function mockAutocomplete() {
  return ({
    options = [],
    renderInput,
    onInputChange,
    onChange,
    inputValue = "",
    noOptionsText = "No options",
    loading,
    disabled,
  }: any) => {
    const input = renderInput({
      InputProps: {},
      inputProps: {
        value: inputValue,
        onChange: (event: any) => onInputChange?.(event, event.target.value),
        placeholder: "Search users to invite...",
      },
      placeholder: "Search users to invite...",
    });

    return createElement(
      "div",
      null,
      input,
      loading ? createElement("div", null, "Loading") : null,
      !loading && options.length === 0
        ? createElement("div", null, noOptionsText)
        : null,
      !disabled && options.length > 0
        ? createElement(
            "div",
            null,
            options.map((option: any) =>
              createElement(
                "button",
                {
                  key: option.id,
                  type: "button",
                  onClick: () => onChange?.(null, option),
                },
                `${option.fullName} (${option.email})`,
              ),
            ),
          )
        : null,
    );
  };
}

vi.mock("@mui/material/Box", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/Card", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/CardContent", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/Typography", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/Stack", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/Alert", () => ({ default: mockAlert() }));
vi.mock("@mui/material/Link", () => ({ default: mockWrapper("a") }));
vi.mock("@mui/material/TextField", () => ({ default: mockTextField() }));
vi.mock("@mui/material/Button", () => ({ default: mockButton() }));
vi.mock("@mui/material/CircularProgress", () => ({ default: mockWrapper("span") }));
vi.mock("@mui/material/Avatar", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/Dialog", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/DialogTitle", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/DialogContent", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/DialogActions", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/Chip", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/IconButton", () => ({ default: mockButton() }));
vi.mock("@mui/material/Autocomplete", () => ({ default: mockAutocomplete() }));
vi.mock("@mui/material/Paper", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/Tabs", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/Tab", () => ({ default: mockWrapper("button") }));
vi.mock("@mui/material/Table", () => ({ default: mockWrapper("table") }));
vi.mock("@mui/material/TableBody", () => ({ default: mockWrapper("tbody") }));
vi.mock("@mui/material/TableCell", () => ({ default: mockWrapper("td") }));
vi.mock("@mui/material/TableContainer", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material/TableHead", () => ({ default: mockWrapper("thead") }));
vi.mock("@mui/material/TableRow", () => ({ default: mockWrapper("tr") }));
vi.mock("@mui/material/Grid", () => ({ default: mockWrapper("div") }));
vi.mock("@mui/material", () => ({
  Box: mockWrapper("div"),
  Card: mockWrapper("div"),
  CardContent: mockWrapper("div"),
  Typography: mockWrapper("div"),
  Stack: mockWrapper("div"),
  Alert: mockAlert(),
  Link: mockWrapper("a"),
  TextField: mockTextField(),
  Button: mockButton(),
  CircularProgress: mockWrapper("span"),
  Avatar: mockWrapper("div"),
  Dialog: mockWrapper("div"),
  DialogTitle: mockWrapper("div"),
  DialogContent: mockWrapper("div"),
  DialogActions: mockWrapper("div"),
  Chip: mockWrapper("div"),
  IconButton: mockButton(),
  Autocomplete: mockAutocomplete(),
  Paper: mockWrapper("div"),
  Tabs: mockWrapper("div"),
  Tab: mockWrapper("button"),
  Table: mockWrapper("table"),
  TableBody: mockWrapper("tbody"),
  TableCell: mockWrapper("td"),
  TableContainer: mockWrapper("div"),
  TableHead: mockWrapper("thead"),
  TableRow: mockWrapper("tr"),
  Grid: mockWrapper("div"),
}));
