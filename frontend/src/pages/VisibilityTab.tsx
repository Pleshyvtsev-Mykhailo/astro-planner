import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, MenuItem, Skeleton, Slider, Stack, TextField, Typography } from '@mui/material';
import { getLocations } from '../api/locations';
import ErrorAlert from '../components/ErrorAlert';
import VisibilityResult from '../components/VisibilityResult';
import { useApi } from '../hooks/useApi';
import { isValidDate, todayLocal } from '../utils/visibility';
import { useObject } from './objectContext';

const DEFAULT_MIN_ALTITUDE = 20;

const loadLocations = () => getLocations({ sortBy: 'name', pageSize: 100 });

function initialMinAltitude(raw: string | null): number {
  if (raw === null) return DEFAULT_MIN_ALTITUDE;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_MIN_ALTITUDE;
  return Math.min(90, Math.max(0, Math.round(n)));
}

export default function VisibilityTab() {
  const object = useObject();
  const [params, setParams] = useSearchParams();
  const { data, error, reload } = useApi(loadLocations);

  const [locId, setLocId] = useState<number | null>(() => {
    const raw = params.get('loc');
    const n = Number(raw);
    return raw !== null && Number.isInteger(n) ? n : null;
  });
  const [dateInput, setDateInput] = useState(() => params.get('date') ?? todayLocal());
  const [minDraft, setMinDraft] = useState(() => initialMinAltitude(params.get('min')));
  const [minCommitted, setMinCommitted] = useState(minDraft);

  const persist = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(key, value);
        return next;
      },
      { replace: true },
    );

  if (error) {
    return (
      <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
        <ErrorAlert error={error} />
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
        <Skeleton variant="rounded" height={320} />
      </Stack>
    );
  }
  if (data.items.length === 0) {
    return <Alert severity="info">Немає жодного місця спостереження.</Alert>;
  }

  const place = data.items.find((l) => l.id === locId) ?? data.items[0];
  const dateValid = isValidDate(dateInput);
  const toNumber = (value: number | number[]) => (Array.isArray(value) ? value[0] : value);

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 2fr' },
        }}
      >
        <TextField
          select
          label="Місце спостереження"
          value={place.id}
          onChange={(e) => {
            const id = Number(e.target.value);
            setLocId(id);
            persist('loc', String(id));
          }}
          helperText={`Широта ${place.latitude.toFixed(2)}°, довгота ${place.longitude.toFixed(2)}°`}
        >
          {data.items.map((l) => (
            <MenuItem key={l.id} value={l.id}>
              {l.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Дата"
          type="date"
          value={dateInput}
          onChange={(e) => {
            setDateInput(e.target.value);
            if (isValidDate(e.target.value)) persist('date', e.target.value);
          }}
          error={!dateValid}
          helperText={!dateValid ? 'Вкажіть коректну дату' : undefined}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <Box sx={{ px: 1 }}>
          <Typography id="min-altitude-label" variant="body2" gutterBottom>
            Мінімальна висота: {minDraft}°
          </Typography>
          <Slider
            aria-labelledby="min-altitude-label"
            value={minDraft}
            min={0}
            max={90}
            step={1}
            valueLabelDisplay="auto"
            onChange={(_, v) => setMinDraft(toNumber(v))}
            onChangeCommitted={(_, v) => {
              const value = toNumber(v);
              setMinCommitted(value);
              persist('min', String(value));
            }}
          />
        </Box>
      </Box>

      {dateValid && (
        <VisibilityResult object={object} place={place} date={dateInput} minAltitude={minCommitted} />
      )}
    </Stack>
  );
}