import { useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CurvePoint } from '../api/types';
import { buildChartData, findDarkRanges, parseUtc, solarClock } from '../utils/visibility';

interface Props {
  points: CurvePoint[];
  longitude: number;
  minAltitude: number;
  bestTimeUtc: string | null;
  bestAltitude: number | null;
}

const HOUR_MS = 3600000;
const X_TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const Y_TICKS = [-90, -60, -30, 0, 30, 60, 90];

export default function AltitudeChart({
  points,
  longitude,
  minAltitude,
  bestTimeUtc,
  bestAltitude,
}: Props) {
  const theme = useTheme();
  const { t0, data } = useMemo(() => buildChartData(points), [points]);
  const darkRanges = useMemo(() => findDarkRanges(points, t0), [points, t0]);

  if (data.length === 0) {
    return <Typography color="text.secondary">Немає даних для графіка.</Typography>;
  }

  const clock = (x: number) => solarClock(t0 + x * HOUR_MS, longitude);
  const best =
    bestTimeUtc !== null && bestAltitude !== null
      ? { x: (parseUtc(bestTimeUtc) - t0) / HOUR_MS, y: bestAltitude }
      : null;
  const textColor = theme.palette.text.secondary;

  return (
    <Box>
      <Box
        role="img"
        aria-label="Графік висоти об’єкта над горизонтом протягом ночі"
        sx={{ width: '100%', height: { xs: 260, sm: 340 } }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" />

            {darkRanges.map(([x1, x2], i) => (
              <ReferenceArea
                key={i}
                x1={x1}
                x2={x2}
                fill={theme.palette.primary.main}
                fillOpacity={0.12}
              />
            ))}

            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 24]}
              ticks={X_TICKS}
              tickFormatter={(x: number) => clock(x)}
              stroke={textColor}
            />
            <YAxis
              domain={[-90, 90]}
              ticks={Y_TICKS}
              tickFormatter={(v: number) => `${v}°`}
              width={48}
              stroke={textColor}
            />

            <ReferenceLine
              y={0}
              stroke={textColor}
              label={{ value: 'Горизонт', position: 'insideBottomRight', fill: textColor, fontSize: 12 }}
            />
            <ReferenceLine
              y={minAltitude}
              stroke={theme.palette.warning.main}
              strokeDasharray="6 4"
              label={{
                value: `Мінімальна висота ${minAltitude}°`,
                position: 'insideTopRight',
                fill: theme.palette.warning.main,
                fontSize: 12,
              }}
            />

            <Tooltip
              labelFormatter={(x: unknown) => `Місцевий сонячний час: ${clock(Number(x))}`}
              formatter={(value: unknown) =>
                [`${Number(value).toFixed(1)}°`, 'Висота'] as [string, string]
              }
              contentStyle={{
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />

            <Line
              type="monotone"
              dataKey="altitude"
              name="Висота"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            {best && (
              <ReferenceDot x={best.x} y={best.y} r={5} fill={theme.palette.warning.main} stroke="none" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
        Час на осі: місцевий сонячний (UTC плюс довгота/15 годин), від полудня до полудня. Затінені
        ділянки: Сонце нижче −12°. Пунктир: мінімальна висота. Жовта точка: найвища висота.
      </Typography>
    </Box>
  );
}