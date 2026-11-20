import { useState, type FormEvent } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
} from '@mui/material';
import { loadLookups } from '../api/lookups';
import { ApiError, fieldError } from '../api/client';
import type { CelestialObject, Location as Place, ObservationInput } from '../api/types';
import { useApi } from '../hooks/useApi';
import { parseLocalDateTime } from '../utils/datetime';
import ErrorAlert from './ErrorAlert';

export interface FormValues {
  objectId: string;
  locationId: string;
  observed: string;
  notes: string;
}

type FieldErrs = Partial<Record<keyof FormValues, string>>;

interface Props {
  initial: FormValues;
  submitLabel: string;
  onSubmit: (input: ObservationInput) => Promise<void>;
  onCancel: () => void;
}

const NOTES_MAX = 1000;

function validate(
  v: FormValues,
  objects: CelestialObject[],
  locations: Place[],
): { errors: FieldErrs; input?: ObservationInput } {
  const errors: FieldErrs = {};
  const objectId = Number(v.objectId);
  const locationId = Number(v.locationId);
  if (!v.objectId || !objects.some((o) => o.id === objectId)) errors.objectId = 'Оберіть об’єкт';
  if (!v.locationId || !locations.some((l) => l.id === locationId)) {
    errors.locationId = 'Оберіть місце спостереження';
  }
  const when = parseLocalDateTime(v.observed);
  if (when.error) errors.observed = when.error;
  if (v.notes.length > NOTES_MAX) {
    errors.notes = `Нотатки не можуть бути довшими за ${NOTES_MAX} символів`;
  }
  if (Object.keys(errors).length > 0 || !when.iso) return { errors };
  return {
    errors,
    input: {
      celestialObjectId: objectId,
      locationId,
      observedAtUtc: when.iso,
      notes: v.notes.trim(),
    },
  };
}

export default function ObservationForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const { data, error: loadError, reload } = useApi(loadLookups);
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<FieldErrs>({});
  const [serverError, setServerError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loadError) {
    return (
      <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
        <ErrorAlert error={loadError} />
        <Button variant="outlined" onClick={reload}>
          Повторити
        </Button>
      </Stack>
    );
  }
  if (!data) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" height={56} />
      </Stack>
    );
  }

  const [objectsPage, locationsPage] = data;
  const objects = objectsPage.items;
  const locations = locationsPage.items;

  const change = (key: keyof FormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setServerError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    const result = validate(values, objects, locations);
    setErrors(result.errors);
    if (!result.input) return;

    setSubmitting(true);
    try {
      await onSubmit(result.input);
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err
          : new ApiError(0, 'Непередбачена помилка', 'Спробуйте ще раз.'),
      );
      setSubmitting(false);
    }
  };

  const objectValue = objects.some((o) => String(o.id) === values.objectId) ? values.objectId : '';
  const locationValue = locations.some((l) => String(l.id) === values.locationId)
    ? values.locationId
    : '';

  const objectError = errors.objectId ?? fieldError(serverError, 'celestialObjectId');
  const locationError = errors.locationId ?? fieldError(serverError, 'locationId');
  const observedError = errors.observed ?? fieldError(serverError, 'observedAtUtc');
  const notesError = errors.notes ?? fieldError(serverError, 'notes');

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ maxWidth: 640 }}>
        <ErrorAlert error={serverError} />

        <TextField
          select
          label="Небесний об’єкт"
          value={objectValue}
          onChange={(e) => change('objectId')(e.target.value)}
          error={Boolean(objectError)}
          helperText={objectError}
          disabled={submitting}
          required
        >
          {objects.map((o) => (
            <MenuItem key={o.id} value={String(o.id)}>
              {o.name}
              {o.commonName ? ` — ${o.commonName}` : ''}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Місце спостереження"
          value={locationValue}
          onChange={(e) => change('locationId')(e.target.value)}
          error={Boolean(locationError)}
          helperText={locationError}
          disabled={submitting}
          required
        >
          {locations.map((l) => (
            <MenuItem key={l.id} value={String(l.id)}>
              {l.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Дата й час спостереження"
          type="datetime-local"
          value={values.observed}
          onChange={(e) => change('observed')(e.target.value)}
          error={Boolean(observedError)}
          helperText={observedError ?? 'Ваш місцевий час'}
          disabled={submitting}
          slotProps={{ inputLabel: { shrink: true } }}
          required
        />

        <TextField
          label="Нотатки"
          value={values.notes}
          onChange={(e) => change('notes')(e.target.value)}
          error={Boolean(notesError)}
          helperText={notesError ?? `${values.notes.length} / ${NOTES_MAX}`}
          disabled={submitting}
          multiline
          minRows={3}
        />

        <Stack direction="row" spacing={2}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {submitLabel}
          </Button>
          <Button onClick={onCancel} disabled={submitting}>
            Скасувати
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}