import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Box, CircularProgress } from "@mui/material";
import { API_URL } from "../api/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchVerify = async () => {
      try {
        const response = await axios.post(
          API_URL,
          {
            query: `
              query Verify {
                verify
              }
            `,
          },
          {
            withCredentials: true,
          },
        );

        if (response.data.errors?.length) {
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(Boolean(response.data.data?.verify));
        }
      } catch {
        setIsAuthenticated(false);
      }
    };

    fetchVerify();
  }, []);

  if (isAuthenticated === null) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
        }}
      >
        <CircularProgress sx={{ color: "#8b5cf6" }} />
      </Box>
    );
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
