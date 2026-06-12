import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';

import { signupSchema, type SignupFormValues } from '../../schemas/authSchema';
import Input from '../../components/ui/Input';
import UiButton from '../../components/ui/Button';
import { API_URL } from '../../api/api';

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const defaultValues = useMemo<SignupFormValues>(
    () => ({
      fullName: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    }),
    [],
  );

  const { control, handleSubmit, reset } = useForm<SignupFormValues>({
    defaultValues,
    resolver: yupResolver(signupSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (values: SignupFormValues) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(API_URL, {
        query: `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              fullName
              email
              username
            }
          }
        `,
        variables: {
          input: {
            fullName: values.fullName,
            email: values.email,
            username: values.username,
            password: values.password,
          },
        },
      });

      if (response.data.errors?.length) {
        throw new Error(response.data.errors[0].message);
      }

      setMessage('Account created successfully.');
      reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: '1fr 520px',
        },
        background: '#020617',
        overflow: 'hidden',
      }}
    >
      {/* LEFT SIDE */}
      <Box
        sx={{
          display: {
            xs: 'none',
            md: 'flex',
          },
          flexDirection: 'column',
          justifyContent: 'center',
          px: 10,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Purple Glow */}
        <Box
          sx={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: '#7c3aed',
            filter: 'blur(180px)',
            top: -120,
            left: -120,
            opacity: 0.55,
          }}
        />

        {/* Cyan Glow */}
        <Box
          sx={{
            position: 'absolute',
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: '#06b6d4',
            filter: 'blur(180px)',
            bottom: -120,
            right: -50,
            opacity: 0.45,
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              color: 'white',
              fontWeight: 900,
              lineHeight: 1.05,
              mb: 3,
            }}
          >
            Project
            <br />
            Management
            <br />
            Simplified
          </Typography>

          <Typography
            sx={{
              maxWidth: 550,
              color: 'rgba(255,255,255,.75)',
              fontSize: '1.1rem',
              lineHeight: 1.8,
            }}
          >
            Create projects, invite collaborators, manage
            expenses and incomes, and generate real-time
            budget reports with a powerful GraphQL platform.
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            sx={{ mt: 5 }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                borderRadius: 3,
                background: 'rgba(255,255,255,.05)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <Typography
                variant="h5"
                color="white"
                fontWeight={800}
              >
                GraphQL
              </Typography>
            </Box>

            <Box
              sx={{
                px: 3,
                py: 2,
                borderRadius: 3,
                background: 'rgba(255,255,255,.05)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <Typography
                variant="h5"
                color="white"
                fontWeight={800}
              >
                Prisma
              </Typography>
            </Box>

            <Box
              sx={{
                px: 3,
                py: 2,
                borderRadius: 3,
                background: 'rgba(255,255,255,.05)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <Typography
                variant="h5"
                color="white"
                fontWeight={800}
              >
                React
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* RIGHT SIDE */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3,
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 500,
            borderRadius: 6,
            background: 'rgba(255,255,255,.05)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255,255,255,.08)',
            boxShadow:
              '0 30px 80px rgba(0,0,0,.45)',
          }}
        >
          <CardContent sx={{ p: 5 }}>
            <Typography
              variant="h4"
              sx={{
                color: 'white',
                fontWeight: 800,
              }}
            >
              Create Account
            </Typography>

            <Typography
              sx={{
                color: 'rgba(255,255,255,.65)',
                mt: 1,
                mb: 4,
              }}
            >
              Start collaborating with your team today.
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
              >
                {error}
              </Alert>
            )}

            {message && (
              <Alert
                severity="success"
                sx={{ mb: 2 }}
              >
                {message}
              </Alert>
            )}

            <Stack
              component="form"
              spacing={2.5}
              onSubmit={handleSubmit(onSubmit)}
            >
              <Input
                name="fullName"
                control={control}
                label="Full Name"
              />

              <Input
                name="email"
                control={control}
                label="Email"
                type="email"
              />

              <Input
                name="username"
                control={control}
                label="Username"
              />

              <Input
                name="password"
                control={control}
                label="Password"
                type="password"
              />

              <Input
                name="confirmPassword"
                control={control}
                label="Confirm Password"
                type="password"
              />

              <UiButton
                type="submit"
                loading={loading}
                sx={{
                  mt: 1,
                  height: 54,
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: '1rem',
                  textTransform: 'none',
                  background:
                    'linear-gradient(135deg,#8b5cf6,#06b6d4)',
                  boxShadow:
                    '0 12px 40px rgba(139,92,246,.4)',

                  '&:hover': {
                    background:
                      'linear-gradient(135deg,#7c3aed,#0891b2)',
                  },
                }}
              >
                Create Account
              </UiButton>
            </Stack>

            <Typography
              sx={{
                mt: 4,
                textAlign: 'center',
                color: 'rgba(255,255,255,.6)',
              }}
            >
              Already have an account?{' '}
              <Link
                href="/login"
                underline="none"
                sx={{
                  color: '#67e8f9',
                  fontWeight: 700,
                }}
              >
                Sign In
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}