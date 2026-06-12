import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

export default function Spinner({
  size = 40,
  fullScreen = false,
}) {
  if (fullScreen) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress size={size} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CircularProgress size={size} />
    </Box>
  );
}