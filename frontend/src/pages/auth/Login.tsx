import { useState } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';

import { useForm } from 'react-hook-form';

import Input from '../../components/ui/Input';
import UiButton from '../../components/ui/Button';
import { API_URL } from '../../api/api';
import { useNavigate } from 'react-router-dom';

type LoginFormValues = {
  emailOrUsername: string;
  password: string;
};

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate()

  const { control, handleSubmit } =
    useForm<LoginFormValues>({
      defaultValues: {
        emailOrUsername: '',
        password: '',
      },
    });

  const onSubmit = async (
    values: LoginFormValues,
  ) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        API_URL,
        {
          query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) 
            }
          `,
          variables: {
            input: {
              emailOrUsername:
                values.emailOrUsername,
              password: values.password,
            },
          },
        },
        {
          withCredentials: true,
        },
      );

      if (response.data.errors?.length) {
        throw new Error(
          response.data.errors[0].message,
        );
      }

      // Redirect after login
      navigate('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed',
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
        }}
      >
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
            component="h2"
            variant="h2"
            sx={{
              color: 'white',
              fontWeight: 900,
              lineHeight: 1.05,
              mb: 3,
            }}
          >
            Welcome
            <br />
            Back.
          </Typography>

          <Typography
            sx={{
              maxWidth: 550,
              color: 'rgba(255,255,255,.75)',
              fontSize: '1.1rem',
              lineHeight: 1.8,
            }}
          >
            Access your projects, collaborate with
            your team, manage finances, and stay on
            top of every project from one place.
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
                background:
                  'rgba(255,255,255,.05)',
              }}
            >
                <Typography
                  component="span"
                  color="white"
                  sx={{ fontWeight: 700 }}
                >
                  Projects
              </Typography>
            </Box>

            <Box
              sx={{
                px: 3,
                py: 2,
                borderRadius: 3,
                background:
                  'rgba(255,255,255,.05)',
              }}
            >
                <Typography
                  component="span"
                  color="white"
                  sx={{ fontWeight: 700 }}
                >
                Invitations
              </Typography>
            </Box>

            <Box
              sx={{
                px: 3,
                py: 2,
                borderRadius: 3,
                background:
                  'rgba(255,255,255,.05)',
              }}
            >
                <Typography
                  component="span"
                  color="white"
                  sx={{ fontWeight: 700 }}
                >
                  Budgets
                </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* LOGIN CARD */}
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
            background:
              'rgba(255,255,255,.05)',
            backdropFilter: 'blur(25px)',
            border:
              '1px solid rgba(255,255,255,.08)',
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
              Sign In
            </Typography>

            <Typography
              sx={{
                color:
                  'rgba(255,255,255,.65)',
                mt: 1,
                mb: 4,
              }}
            >
              Continue where you left off.
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
              >
                {error}
              </Alert>
            )}

            <Stack
              component="form"
              spacing={2.5}
              onSubmit={handleSubmit(onSubmit)}
            >
              <Input
                name="emailOrUsername"
                control={control}
                label="Email or Username"
              />

              <Input
                name="password"
                control={control}
                label="Password"
                type="password"
              />

              <UiButton
                type="submit"
                loading={loading}
                sx={{
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
                Sign In
              </UiButton>
            </Stack>

            <Typography
              sx={{
                mt: 4,
                textAlign: 'center',
                color:
                  'rgba(255,255,255,.6)',
              }}
            >
              Don't have an account?{' '}
              <Link
                href="/signup"
                underline="none"
                sx={{
                  color: '#67e8f9',
                  fontWeight: 700,
                }}
              >
                Create one
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}