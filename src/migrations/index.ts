import * as migration_20260921_021904 from './20260921_021904';
import * as migration_20260921_025320 from './20260921_025320';

export const migrations = [
  {
    up: migration_20260921_021904.up,
    down: migration_20260921_021904.down,
    name: '20260921_021904',
  },
  {
    up: migration_20260921_025320.up,
    down: migration_20260921_025320.down,
    name: '20260921_025320'
  },
];
