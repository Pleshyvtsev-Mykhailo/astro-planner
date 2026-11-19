import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Collapse,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TablePagination,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getObjects, type ObjectSortBy } from '../api/objects';
import ErrorAlert from '../components/ErrorAlert';
import ObjectsList from '../components/ObjectsList';
import { useApi } from '../hooks/useApi';
import { OBJECT_TYPE_LABELS, OBJECT_TYPES, parseMagnitude, setOrDelete } from '../utils/format';

const SORT_OPTIONS: { value: ObjectSortBy; label: string }[] = [
  { value: 'name', label: 'Назва' },
  { value: 'magnitude', label: 'Яскравість' },
  { value: 'ra', label: 'Пряме сходження' },
  { value: 'dec', label: 'Схилення' },
];
const PAGE_SIZES = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;

function ListSkeleton() {
  return (
    <Stack spacing={1}>
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={48} />
      ))}
    </Stack>
  );
}

export default function ObjectsPage() {
  const theme = useTheme();
  const narrow = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = params.get('q') ?? '';
  const type = OBJECT_TYPES.find((t) => t === params.get('type'));
  const minMag = params.get('minMag') ?? '';
  const maxMag = params.get('maxMag') ?? '';
  const sortBy = SORT_OPTIONS.find((o) => o.value === params.get('sort'))?.value ?? 'name';
  const descending = params.get('desc') === '1';
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const sizeParam = Number(params.get('size'));
  const pageSize = PAGE_SIZES.includes(sizeParam) ? sizeParam : DEFAULT_PAGE_SIZE;

  const [searchInput, setSearchInput] = useState(search);
  const [minInput, setMinInput] = useState(minMag);
  const [maxInput, setMaxInput] = useState(maxMag);

  const minParsed = parseMagnitude(minInput);
  const maxParsed = parseMagnitude(maxInput);
  const rangeBroken =
    minParsed.value !== undefined && maxParsed.value !== undefined && minParsed.value > maxParsed.value;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const min = parseMagnitude(minInput);
      const max = parseMagnitude(maxInput);
      const broken = min.value !== undefined && max.value !== undefined && min.value > max.value;
      const current = new URLSearchParams(window.location.search);
      const next = new URLSearchParams(window.location.search);
      setOrDelete(next, 'q', searchInput.trim());
      if (!min.error && !max.error && !broken) {
        setOrDelete(next, 'minMag', min.value === undefined ? '' : String(min.value));
        setOrDelete(next, 'maxMag', max.value === undefined ? '' : String(max.value));
      }
      if (next.toString() === current.toString()) return;
      next.delete('page');
      setParams(next, { replace: true });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput, minInput, maxInput, setParams]);

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

  const resetFilters = () => {
    setSearchInput('');
    setMinInput('');
    setMaxInput('');
    setParams(new URLSearchParams(), { replace: true });
  };

  const fetcher = useCallback(
    () =>
      getObjects({
        search: search || undefined,
        type,
        minMagnitude: parseMagnitude(minMag).value,
        maxMagnitude: parseMagnitude(maxMag).value,
        sortBy,
        descending: descending || undefined,
        page,
        pageSize,
      }),
    [search, type, minMag, maxMag, sortBy, descending, page, pageSize],
  );
  const { data, error, loading, reload } = useApi(fetcher);

  const filtersActive = Boolean(search || type || minMag || maxMag);
  const lastPage = data ? Math.max(0, Math.ceil(data.total / pageSize) - 1) : 0;

  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">
        Каталог об’єктів
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1}>
            <TextField
              label="Пошук за назвою"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              fullWidth
            />
            {narrow && (
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setFiltersOpen((open) => !open)}
                sx={{ flexShrink: 0 }}
              >
                Фільтри
              </Button>
            )}
          </Stack>

          <Collapse in={!narrow || filtersOpen}>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' },
                }}
              >
                <TextField
                  select
                  label="Тип об’єкта"
                  value={type ?? 'all'}
                  onChange={(e) => update({ type: e.target.value === 'all' ? '' : e.target.value })}
                >
                  <MenuItem value="all">Усі типи</MenuItem>
                  {OBJECT_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {OBJECT_TYPE_LABELS[t]}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Яскравість від"
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  error={Boolean(minParsed.error)}
                  helperText={minParsed.error}
                />
                <TextField
                  label="Яскравість до"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  error={Boolean(maxParsed.error) || rangeBroken}
                  helperText={
                    maxParsed.error ??
                    (rangeBroken ? 'Максимум не може бути меншим за мінімум' : undefined)
                  }
                />
                <TextField
                  select
                  label="Сортувати за"
                  value={sortBy}
                  onChange={(e) => update({ sort: e.target.value === 'name' ? '' : e.target.value })}
                >
                  {SORT_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Напрямок"
                  value={descending ? 'desc' : 'asc'}
                  onChange={(e) => update({ desc: e.target.value === 'desc' ? '1' : '' })}
                >
                  <MenuItem value="asc">За зростанням</MenuItem>
                  <MenuItem value="desc">За спаданням</MenuItem>
                </TextField>
              </Box>
              {filtersActive && (
                <Box>
                  <Button onClick={resetFilters}>Скинути фільтри</Button>
                </Box>
              )}
            </Stack>
          </Collapse>
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
              <Button color="inherit" size="small" onClick={resetFilters}>
                Скинути фільтри
              </Button>
            ) : undefined
          }
        >
          {filtersActive ? 'За вашими умовами об’єктів не знайдено.' : 'Каталог порожній.'}
        </Alert>
      ) : (
        <Box aria-busy={loading} sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' }}>
          <ObjectsList items={data.items} />
          <TablePagination
            component="div"
            count={data.total}
            page={Math.min(page - 1, lastPage)}
            onPageChange={(_, newPage) => update({ page: newPage === 0 ? '' : String(newPage + 1) }, false)}
            rowsPerPage={pageSize}
            rowsPerPageOptions={PAGE_SIZES}
            onRowsPerPageChange={(e) =>
              update({ size: e.target.value === String(DEFAULT_PAGE_SIZE) ? '' : e.target.value })
            }
            labelRowsPerPage="Рядків на сторінці:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} з ${count}`}
          />
        </Box>
      )}
    </Stack>
  );
}