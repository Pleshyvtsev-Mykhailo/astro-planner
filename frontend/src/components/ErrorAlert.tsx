import { Alert, AlertTitle } from '@mui/material';
import type { ApiError } from '../api/client';

export default function ErrorAlert({ error }: { error: ApiError | null }) {
  if (!error) return null;
  return (
    <Alert severity="error">
      <AlertTitle>{error.title}</AlertTitle>
      {error.detail}
    </Alert>
  );
}