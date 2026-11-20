import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createObservation } from '../api/observations';
import ObservationForm, { type FormValues } from '../components/ObservationForm';
import { toLocalInput } from '../utils/datetime';
import { parseId } from '../utils/params';
import { parseUtc } from '../utils/visibility';

export default function NewObservationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [initial] = useState<FormValues>(() => {
    const objectId = parseId(params.get('objectId'));
    const locationId = parseId(params.get('locationId'));
    const at = params.get('at');
    const atMs = at ? parseUtc(at) : Number.NaN;
    return {
      objectId: objectId ? String(objectId) : '',
      locationId: locationId ? String(locationId) : '',
      observed: toLocalInput(Number.isFinite(atMs) ? new Date(atMs) : new Date()),
      notes: '',
    };
  });

  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/journal'));

  return (
    <Stack spacing={2}>
      <div>
        <Button startIcon={<ArrowBackIcon />} onClick={goBack}>
          Назад
        </Button>
      </div>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
          Новий запис у журналі
        </Typography>
        <ObservationForm
          initial={initial}
          submitLabel="Зберегти запис"
          onSubmit={async (input) => {
            await createObservation(input);
            navigate('/journal', { replace: true });
          }}
          onCancel={goBack}
        />
      </Paper>
    </Stack>
  );
}