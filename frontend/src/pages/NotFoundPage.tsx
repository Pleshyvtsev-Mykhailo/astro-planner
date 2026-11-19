import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Typography variant="h5">Сторінку не знайдено</Typography>
      <Button component={RouterLink} to="/objects" variant="contained">
        До каталогу
      </Button>
    </Stack>
  );
}