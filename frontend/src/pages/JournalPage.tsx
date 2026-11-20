import { useCallback } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { loadLookups } from '../api/lookups';
import { getObservations } from '../api/observations';
import ErrorAlert from '../components/ErrorAlert';
import ObservationsList from '../components/ObservationsList';
import { useApi } from '../hooks/useApi';
import { setOrDelete } from '../utils/format';
import { parseId } from '../utils/params';
import { isValidDate } from '../utils/visibility';

const PAGE_SIZES = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;

function ListSkeleton() {
  return (
    <Stack spacing={1}>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={48} />
      ))}
    </Stack>
  );
}

export default function JournalPage() {
  const [params, setParams] = useSearchParams();

  const objectId = parseId(params.get('obj'));
  const locationId = parseId(params.get('loc'));
  const rawFrom = params.get('from') ?? '';
  const rawTo = params.get('to') ?? '';
  const from = isValidDate(rawFrom) ? rawFrom : '';
  const to = isValidDate(rawTo) ? rawTo : '';
  const rangeBroken = from !== '' && to !== '' && from > to;
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const sizeParam = Number(params.get('size'));
  const pageSize = PAGE_SIZES.includes(sizeParam) ? sizeParam : DEFAULT_PAGE_SIZE;

  const update = (changes: Record<string, string>, resetPage = true) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) setOrDelete(next, key, value);
        if (resetPage) next.delete('page');
        return next;
      },
      { replace: resetPage },
    );
  };

  const fetcher = useCallback(
    () =>
      getObservations({
        objectId,
        locationId,
        from: rangeBroken ? undefined : from || undefined,
        to: rangeBroken ? undefined : to || undefined,
        page,
        pageSize,
      }),
    [objectId, locationId, from, to, rangeBroken, page, pageSize],
  );
  const { data, error, loading, reload } = useApi(fetcher);
  const lookups = useApi(loadLookups);

  const filtersActive = Boolean(objectId || locationId || from || to);
  const lastPage = data ? Math.max(0, Math.ceil(data.total / pageSize) - 1) : 0;
  const objects = lookups.data?.[0].items ?? [];
  const locations = lookups.data?.[1].items ?? [];

  return (
    <Stack spacing={2}>
      <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
        <Typography variant="h4" component="h1">
          Журнал спостережень
        </Typography>
        <Button component={RouterLink} to="/journal/new" variant="contained" startIcon={<AddIcon />}>
          Додати запис
        </Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            }}
          >
            <TextField
              select
              label="Об’єкт"
              value={objects.some((o) => o.id === objectId) ? String(objectId) : 'all'}
              onChange={(e) => update({ obj: e.target.value === 'all' ? '' : e.target.value })}
              disabled={!lookups.data}
            >
              <MenuItem value="all">Усі об’єкти</MenuItem>
              {objects.map((o) => (
                <MenuItem key={o.id} value={String(o.id)}>
                  {o.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Місце"
              value={locations.some((l) => l.id === locationId) ? String(locationId) : 'all'}
              onChange={(e) => update({ loc: e.target.value === 'all' ? '' : e.target.value })}
              disabled={!lookups.data}
            >
              <MenuItem value="all">Усі місця</MenuItem>
              {locations.map((l) => (
                <MenuItem key={l.id} value={String(l.id)}>
                  {l.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Від дати"
              type="date"
              value={from}
              onChange={(e) => update({ from: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="До дати"
              type="date"
              value={to}
              onChange={(e) => update({ to: e.target.value })}
              error={rangeBroken}
              helperText={rangeBroken ? 'Кінець діапазону раніший за початок' : undefined}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
          {filtersActive && (
            <Box>
              <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                Скинути фільтри
              </Button>
            </Box>
          )}
        </Stack>
      </Paper>

      {error ? (
        <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
          <ErrorAlert error={error} />
          <Button variant="outlined" onClick={reload}>
            Повторити
          </Button>
        </Stack>
      ) : !data ? (
        <ListSkeleton />
      ) : data.items.length === 0 ? (
        <Alert
          severity="info"
          action={
            filtersActive ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => setParams(new URLSearchParams(), { replace: true })}
              >
                Скинути фільтри
              </Button>
            ) : (
              <Button color="inherit" size="small" component={RouterLink} to="/journal/new">
                Додати перший запис
              </Button>
            )
          }
        >
          {filtersActive ? 'За вашими умовами записів не знайдено.' : 'У журналі ще немає записів.'}
        </Alert>
      ) : (
        <Box aria-busy={loading} sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' }}>
          <ObservationsList items={data.items} />
          <TablePagination
            component="div"
            count={data.total}
            page={Math.min(page - 1, lastPage)}
            onPageChange={(_, newPage) =>
              update({ page: newPage === 0 ? '' : String(newPage + 1) }, false)
            }
            rowsPerPage={pageSize}
            rowsPerPageOptions={PAGE_SIZES}
            onRowsPerPageChange={(e) =>
              update({ size: e.target.value === String(DEFAULT_PAGE_SIZE) ? '' : e.target.value })
            }
            labelRowsPerPage="Рядків на сторінці:"
            labelDisplayedRows={({ from: f, to: t, count }) => `${f}–${t} з ${count}`}
          />
        </Box>
      )}
    </Stack>
  );
}