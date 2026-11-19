import { useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { CelestialObject, Location as Place } from '../api/types';
import { getCurve, getVisibility } from '../api/visibility';
import { useAuth } from '../auth/authContext';
import { useApi } from '../hooks/useApi';
import { HORIZON_LABELS, parseUtc, solarClock } from '../utils/visibility';
import AltitudeChart from './AltitudeChart';
import ErrorAlert from './ErrorAlert';

interface Props {
  object: CelestialObject;
  place: Place;
  date: string;
  minAltitude: number;
}

const hoursText = (value: number) =>
  `${value.toLocaleString('uk-UA', { maximumFractionDigits: 1 })} год`;

function Stat({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ typography: 'h6' }}>{children}</Box>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Paper>
  );
}

export default function VisibilityResult({ object, place, date, minAltitude }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetcher = useCallback(
    () =>
      Promise.all([
        getVisibility({
          latitude: place.latitude,
          longitude: place.longitude,
          date,
          minAltitude,
          objectId: object.id,
        }),
        getCurve(object.id, { latitude: place.latitude, longitude: place.longitude, date }),
      ]),
    [object.id, place.latitude, place.longitude, date, minAltitude],
  );
  const { data, error, loading, reload } = useApi(fetcher);

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
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={320} />
      </Stack>
    );
  }

  const [summary, curve] = data;
  const item = summary.items.find((i) => i.objectId === object.id);
  const bestTimeUtc = item?.bestTimeUtc ?? null;

  const addToJournal = () => {
    const query = new URLSearchParams({
      objectId: String(object.id),
      locationId: String(place.id),
    });
    if (bestTimeUtc) query.set('at', new Date(parseUtc(bestTimeUtc)).toISOString());
    const target = `/journal/new?${query.toString()}`;
    // Гість спершу входить, після входу повертається саме сюди
    if (!user) navigate('/login', { state: { from: target } });
    else navigate(target);
  };

  return (
    <Stack spacing={2} aria-busy={loading} sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' }}>
      {summary.darkHours === 0 && (
        <Alert severity="info">
          У цю дату в обраному місці Сонце не опускається нижче −12°, темної ночі немає.
        </Alert>
      )}

      {item ? (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          }}
        >
          <Stat label="Видимість">
            <Chip
              size="small"
              color={item.visible ? 'success' : 'default'}
              label={item.visible ? 'Видно' : 'Не видно'}
            />
          </Stat>
          <Stat label="Горизонт">{HORIZON_LABELS[item.horizon]}</Stat>
          <Stat
            label="Найвища висота"
            hint={
              bestTimeUtc
                ? `о ${solarClock(parseUtc(bestTimeUtc), place.longitude)} за місцевим сонячним часом`
                : undefined
            }
          >
            {item.bestAltitudeDegrees !== null ? `${item.bestAltitudeDegrees.toFixed(1)}°` : '—'}
          </Stat>
          <Stat label={`Годин вище ${minAltitude}°`}>{hoursText(item.hoursAboveMinAltitude)}</Stat>
          <Stat label="Темна ніч">{hoursText(summary.darkHours)}</Stat>
        </Box>
      ) : (
        <Alert severity="warning">Сервер не повернув підсумок видимості для цього об’єкта.</Alert>
      )}

      <AltitudeChart
        points={curve.points}
        longitude={place.longitude}
        minAltitude={minAltitude}
        bestTimeUtc={bestTimeUtc}
        bestAltitude={item?.bestAltitudeDegrees ?? null}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={addToJournal}>
          Додати в журнал
        </Button>
        {!user && (
          <Typography variant="caption" color="text.secondary">
            Для запису в журнал потрібен вхід.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}