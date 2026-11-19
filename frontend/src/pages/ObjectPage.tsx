import { useCallback } from 'react';
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { Button, Paper, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ApiError } from '../api/client';
import { getObject } from '../api/objects';
import ErrorAlert from '../components/ErrorAlert';
import TypeChip from '../components/TypeChip';
import { useApi } from '../hooks/useApi';

export default function ObjectPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const navigate = useNavigate();
  const location = useLocation();
  const onVisibility = useMatch('/objects/:id/visibility') !== null;

  const fetcher = useCallback(
    () =>
      Number.isInteger(id)
        ? getObject(id)
        : Promise.reject(new ApiError(404, 'Не знайдено', 'Некоректний номер об’єкта.')),
    [id],
  );
  const { data, error, reload } = useApi(fetcher);
  const object = data && data.id === id ? data : undefined;

  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/objects'));

  return (
    <Stack spacing={2}>
      <div>
        <Button startIcon={<ArrowBackIcon />} onClick={goBack}>
          До каталогу
        </Button>
      </div>

      {error ? (
        <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
          <ErrorAlert error={error} />
          {error.status !== 404 && (
            <Button variant="outlined" onClick={reload}>
              Повторити
            </Button>
          )}
        </Stack>
      ) : !object ? (
        <Stack spacing={1}>
          <Skeleton variant="text" width={240} height={48} />
          <Skeleton variant="rounded" height={200} />
        </Stack>
      ) : (
        <>
          <Stack spacing={1}>
            <Typography variant="h4" component="h1">
              {object.name}
              {object.commonName ? ` — ${object.commonName}` : ''}
            </Typography>
            <div>
              <TypeChip type={object.type} />
            </div>
          </Stack>

          <Tabs value={onVisibility ? 'visibility' : 'description'} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Опис" value="description" component={RouterLink} to={`/objects/${id}`} replace />
            <Tab
              label="Видимість"
              value="visibility"
              component={RouterLink}
              to={`/objects/${id}/visibility`}
              replace
            />
          </Tabs>

          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Outlet context={{ object }} />
          </Paper>
        </>
      )}
    </Stack>
  );
}