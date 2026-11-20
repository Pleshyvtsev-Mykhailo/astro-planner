import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Card,
  CardActionArea,
  CardContent,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { Observation } from '../api/types';
import { formatDateTime } from '../utils/datetime';

export default function ObservationsList({ items }: { items: Observation[] }) {
  const theme = useTheme();
  const narrow = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const navigate = useNavigate();

  if (narrow) {
    return (
      <Stack spacing={1.5}>
        {items.map((o) => (
          <Card key={o.id} variant="outlined">
            <CardActionArea component={RouterLink} to={`/journal/${o.id}`}>
              <CardContent>
                <Typography variant="h6" component="h2">
                  {o.objectName}
                </Typography>
                <Typography color="text.secondary">
                  {formatDateTime(o.observedAtUtc)} · {o.locationName}
                </Typography>
                {o.notes && (
                  <Typography variant="body2" noWrap sx={{ mt: 1 }}>
                    {o.notes}
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table aria-label="Мої записи спостережень">
        <TableHead>
          <TableRow>
            <TableCell>Дата й час</TableCell>
            <TableCell>Об’єкт</TableCell>
            <TableCell>Місце</TableCell>
            <TableCell>Нотатки</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((o) => (
            <TableRow
              key={o.id}
              hover
              onClick={() => navigate(`/journal/${o.id}`)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell>
                <Link
                  component={RouterLink}
                  to={`/journal/${o.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {formatDateTime(o.observedAtUtc)}
                </Link>
              </TableCell>
              <TableCell>{o.objectName}</TableCell>
              <TableCell>{o.locationName}</TableCell>
              <TableCell sx={{ maxWidth: 320 }}>
                <Typography variant="body2" noWrap>
                  {o.notes ?? '—'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}