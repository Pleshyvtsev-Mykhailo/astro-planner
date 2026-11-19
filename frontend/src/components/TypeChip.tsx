import { Chip } from '@mui/material';
import type { ObjectType } from '../api/types';
import { OBJECT_TYPE_LABELS } from '../utils/format';

export default function TypeChip({ type }: { type: ObjectType }) {
  return <Chip size="small" variant="outlined" label={OBJECT_TYPE_LABELS[type]} />;
}