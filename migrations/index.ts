import * as migration_20260119_080815 from './20260119_080815';

export const migrations = [
  {
    up: migration_20260119_080815.up,
    down: migration_20260119_080815.down,
    name: '20260119_080815'
  },
];
