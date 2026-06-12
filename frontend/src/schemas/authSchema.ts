import * as yup from "yup"

export const signupSchema = yup.object({
  fullName: yup.string().trim().required('Full name is required'),
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  username: yup.string().trim().min(3, 'Username must be at least 3 characters').required('Username is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});

export type SignupFormValues = yup.InferType<typeof signupSchema>;