import { Fragment } from 'react';
import { Box, Typography } from '@mui/material';
import { OBJECT_TYPE_LABELS, formatDeclination, formatMagnitude, formatRightAscension } from '../utils/format';
import { useObject } from './objectContext';

export default function ObjectDescriptionTab() {
  const o = useObject();
  const rows: [string, string][] = [
    ['Назва', o.name],
    ['Звичайна назва', o.commonName ?? '—'],
    ['Тип', OBJECT_TYPE_LABELS[o.type]],
    ['Пряме сходження', formatRightAscension(o.rightAscensionHours)],
    ['Схилення', formatDeclination(o.declinationDegrees)],
    ['Яскравість (зоряна величина)', formatMagnitude(o.magnitude)],
  ];

  return (
    <>
      <Box
        component="dl"
        sx={{
          m: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '260px 1fr' },
          columnGap: 3,
          rowGap: 1.5,
        }}
      >
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <Typography component="dt" color="text.secondary">
              {label}
            </Typography>
            <Typography component="dd" sx={{ m: 0 }}>
              {value}
            </Typography>
          </Fragment>
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        Менше значення зоряної величини означає яскравіший об’єкт.
      </Typography>
    </>
  );
}