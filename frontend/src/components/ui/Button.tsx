// components/ui/Button.jsx

import type { ReactNode } from 'react';
import MuiButton from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

export default function Button({
  children,
  loading = false,
  disabled = false,
  ...props
}: {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  [key: string]: any;
}) {
  return (
    <MuiButton
      variant="contained"
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <CircularProgress size={20} />
      ) : (
        children
      )}
    </MuiButton>
  );
}