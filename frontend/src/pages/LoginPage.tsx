import { useState, type FormEvent, type SyntheticEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { ApiError, fieldError } from '../api/client';
import { useAuth } from '../auth/authContext';
import ErrorAlert from '../components/ErrorAlert';

type Mode = 'login' | 'register';

interface FieldErrs {
  username?: string;
  password?: string;
}

const USERNAME_RE = /^[A-Za-z0-9_.-]+$/;
const REGISTER_HINT = 'Від 3 до 50 символів: латиниця, цифри та символи _ . -';
const PASSWORD_HINT = 'Від 8 до 100 символів';

function validate(mode: Mode, username: string, password: string): FieldErrs {
  const errs: FieldErrs = {};
  if (!username.trim()) {
    errs.username = 'Введіть ім’я користувача';
  } else if (mode === 'register') {
    if (username.length < 3 || username.length > 50) {
      errs.username = 'Ім’я користувача має містити від 3 до 50 символів';
    } else if (!USERNAME_RE.test(username)) {
      errs.username = 'Дозволено латиницю, цифри та символи _ . -';
    }
  }
  if (!password) {
    errs.password = 'Введіть пароль';
  } else if (mode === 'register' && (password.length < 8 || password.length > 100)) {
    errs.password = 'Пароль має містити від 8 до 100 символів';
  }
  return errs;
}

export default function LoginPage() {
  const { user, status, signIn, signUp } = useAuth();
  const location = useLocation();
  const navState = location.state as { from?: string; expired?: boolean } | null;
  const from = navState?.from ?? '/objects';

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrs>({});
  const [serverError, setServerError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (user) return <Navigate to={from} replace />;

  const changeMode = (_: SyntheticEvent, value: Mode) => {
    setMode(value);
    setErrors({});
    setServerError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    const found = validate(mode, username, password);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      if (mode === 'login') await signIn(username, password);
      else await signUp(username, password);
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err
          : new ApiError(0, 'Непередбачена помилка', 'Спробуйте ще раз.'),
      );
      setSubmitting(false);
    }
  };

  const usernameError = errors.username ?? fieldError(serverError, 'username');
  const passwordError = errors.password ?? fieldError(serverError, 'password');

  return (
    <Paper sx={{ maxWidth: 440, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Tabs value={mode} onChange={changeMode} variant="fullWidth" sx={{ mb: 3 }}>
        <Tab label="Вхід" value="login" disabled={submitting} />
        <Tab label="Реєстрація" value="register" disabled={submitting} />
      </Tabs>

      <Box component="form" noValidate onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {navState?.expired && <Alert severity="info">Сесія завершилась. Увійдіть знову.</Alert>}
          <ErrorAlert error={serverError} />

          <Typography variant="h6" component="h1">
            {mode === 'login' ? 'Вхід до AstroPlanner' : 'Створення облікового запису'}
          </Typography>

          <TextField
            label="Ім’я користувача"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((prev) => ({ ...prev, username: undefined }));
              setServerError(null);
            }}
            error={Boolean(usernameError)}
            helperText={usernameError ?? (mode === 'register' ? REGISTER_HINT : undefined)}
            disabled={submitting}
            autoComplete="username"
            autoFocus
            required
            fullWidth
          />
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
              setServerError(null);
            }}
            error={Boolean(passwordError)}
            helperText={passwordError ?? (mode === 'register' ? PASSWORD_HINT : undefined)}
            disabled={submitting}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {mode === 'login' ? 'Увійти' : 'Зареєструватися'}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}