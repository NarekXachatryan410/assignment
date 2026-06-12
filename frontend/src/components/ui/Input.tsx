// components/ui/Input.jsx

import { Controller } from "react-hook-form";
import TextField from "@mui/material/TextField";

export default function Input({
  name,
  control,
  label,
  type = "text",
  rules,
  disabled = false,
  ...props
}: {
  name: string;
  control: any;
  label: string;
  type?: string;
  rules?: any;
  disabled?: boolean;
  [key: string]: any;
}) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          fullWidth
          label={label}
          type={type}
          disabled={disabled}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(248, 250, 252, 0.95)',
              borderRadius: 2,
              color: '#0f172a',
              '& fieldset': {
                borderColor: 'rgba(148, 163, 184, 0.55)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(129, 140, 248, 0.9)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#8b5cf6',
                boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.18)',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(30, 41, 59, 0.85)',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#7c3aed',
            },
            '& .MuiFormHelperText-root': {
              color: 'rgba(226, 232, 240, 0.95)',
            },
          }}
          {...props}
        />
      )}
    />
  );
}