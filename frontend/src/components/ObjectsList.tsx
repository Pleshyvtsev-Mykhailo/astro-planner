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
import type { CelestialObject } from '../api/types';
import { formatDeclination, formatMagnitude, formatRightAscension } from '../utils/format';
import TypeChip from './TypeChip';

export default function ObjectsList({ items }: { items: CelestialObject[] }) {
  const theme = useTheme();
  const narrow = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const navigate = useNavigate();

  if (narrow) {
    return (
      <Stack spacing={1.5}>
        {items.map((o) => (
          <Card key={o.id} variant="outlined">
            <CardActionArea component={RouterLink} to={`/objects/${o.id}`}>
              <CardContent>
                <Stack
                direction="row"
                spacing={1}
                sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                >
                <Typography variant="h6" component="h2">
                    {o.name}
                </Typography>
                <TypeChip type={o.type} />
                </Stack>
                <Typography color="text.secondary">{o.commonName ?? '—'}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Яскравість: {formatMagnitude(o.magnitude)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table aria-label="Каталог небесних об’єктів">
        <TableHead>
          <TableRow>
            <TableCell>Назва</TableCell>
            <TableCell>Звичайна назва</TableCell>
            <TableCell>Тип</TableCell>
            <TableCell align="right">Яскравість</TableCell>
            <TableCell align="right">Пряме сходження</TableCell>
            <TableCell align="right">Схилення</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((o) => (
            <TableRow
              key={o.id}
              hover
              onClick={() => navigate(`/objects/${o.id}`)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell>
                {}
                <Link
                  component={RouterLink}
                  to={`/objects/${o.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {o.name}
                </Link>
              </TableCell>
              <TableCell>{o.commonName ?? '—'}</TableCell>
              <TableCell>
                <TypeChip type={o.type} />
              </TableCell>
              <TableCell align="right">{formatMagnitude(o.magnitude)}</TableCell>
              <TableCell align="right">{formatRightAscension(o.rightAscensionHours)}</TableCell>
              <TableCell align="right">{formatDeclination(o.declinationDegrees)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}