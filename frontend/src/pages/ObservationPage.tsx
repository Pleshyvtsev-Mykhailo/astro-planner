import { useCallback, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { ApiError } from '../api/client';
import { deleteObservation, getObservation, updateObservation } from '../api/observations';
import ErrorAlert from '../components/ErrorAlert';
import ObservationForm from '../components/ObservationForm';
import { useApi } from '../hooks/useApi';
import { formatDateTime, isoToLocalInput } from '../utils/datetime';

export default function ObservationPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const navigate = useNavigate();
  const location = useLocation();

  const fetcher = useCallback(
    () =>
      Number.isInteger(id)
        ? getObservation(id)
        : Promise.reject(new ApiError(404, 'Не знайдено', 'Некоректний номер запису.')),
    [id],
  );
  const { data, error, reload } = useApi(fetcher);
  const observation = data && data.id === id ? data : undefined;

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/journal'));

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteObservation(id);
      navigate('/journal', { replace: true });
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err
          : new ApiError(0, 'Непередбачена помилка', 'Спробуйте ще раз.'),
      );
      setDeleting(false);
    }
  };

  return (
    <Stack spacing={2}>
      <div>
        <Button startIcon={<ArrowBackIcon />} onClick={goBack}>
          До журналу
        </Button>
      </div>

      {error ? (
        <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
          <ErrorAlert error={error} />
          {error.status !== 404 && error.status !== 403 && (
            <Button variant="outlined" onClick={reload}>
              Повторити
            </Button>
          )}
        </Stack>
      ) : !observation ? (
        <Stack spacing={1}>
          <Skeleton variant="text" width={240} height={48} />
          <Skeleton variant="rounded" height={200} />
        </Stack>
      ) : editing ? (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
            Редагування запису
          </Typography>
          <ObservationForm
            initial={{
              objectId: String(observation.celestialObjectId),
              locationId: String(observation.locationId),
              observed: isoToLocalInput(observation.observedAtUtc),
              notes: observation.notes ?? '',
            }}
            submitLabel="Зберегти зміни"
            onSubmit={async (input) => {
              await updateObservation(id, input);
              setEditing(false);
              setSaved(true);
              reload();
            }}
            onCancel={() => setEditing(false)}
          />
        </Paper>
      ) : (
        <>
          {saved && (
            <Alert severity="success" onClose={() => setSaved(false)}>
              Зміни збережено.
            </Alert>
          )}

          <Typography variant="h4" component="h1">
            Запис про спостереження
          </Typography>

          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              component="dl"
              sx={{
                m: 0,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '200px 1fr' },
                columnGap: 3,
                rowGap: 1.5,
              }}
            >
              <Typography component="dt" color="text.secondary">
                Об’єкт
              </Typography>
              <Typography component="dd" sx={{ m: 0 }}>
                <Link component={RouterLink} to={`/objects/${observation.celestialObjectId}`}>
                  {observation.objectName}
                </Link>
              </Typography>

              <Typography component="dt" color="text.secondary">
                Місце
              </Typography>
              <Typography component="dd" sx={{ m: 0 }}>
                {observation.locationName}
              </Typography>

              <Typography component="dt" color="text.secondary">
                Дата й час
              </Typography>
              <Typography component="dd" sx={{ m: 0 }}>
                {formatDateTime(observation.observedAtUtc)}
              </Typography>

              <Typography component="dt" color="text.secondary">
                Нотатки
              </Typography>
              <Typography component="dd" sx={{ m: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {observation.notes ? observation.notes : '—'}
              </Typography>
            </Box>
          </Paper>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => {
                setSaved(false);
                setEditing(true);
              }}
            >
              Редагувати
            </Button>
            <Button
              color="error"
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={() => {
                setDeleteError(null);
                setConfirmOpen(true);
              }}
            >
              Видалити
            </Button>
          </Stack>
        </>
      )}

      <Dialog open={confirmOpen} onClose={() => !deleting && setConfirmOpen(false)}>
        <DialogTitle>Видалити запис?</DialogTitle>
        <DialogContent>
          <DialogContentText>Цю дію не можна скасувати.</DialogContentText>
          {deleteError && (
            <Box sx={{ mt: 2 }}>
              <ErrorAlert error={deleteError} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={deleting}>
            Скасувати
          </Button>
          <Button
            color="error"
            onClick={confirmDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            Видалити
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}