import * as migration_20260921_021904 from './20260921_021904';
import * as migration_20260921_025320 from './20260921_025320';
import * as migration_20260921_041748_digistore_catalog_fields from './20260921_041748_digistore_catalog_fields';
import * as migration_20260922_000001_locale_parent_indexes from './20260922_000001_locale_parent_indexes';

export const migrations = [
  {
    up: migration_20260921_021904.up,
    down: migration_20260921_021904.down,
    name: '20260921_021904',
  },
  {
    up: migration_20260921_025320.up,
    down: migration_20260921_025320.down,
    name: '20260921_025320',
  },
  {
    up: migration_20260921_041748_digistore_catalog_fields.up,
    down: migration_20260921_041748_digistore_catalog_fields.down,
    name: '20260921_041748_digistore_catalog_fields'
  },
  {
    up: migration_20260922_000001_locale_parent_indexes.up,
    down: migration_20260922_000001_locale_parent_indexes.down,
    name: '20260922_000001_locale_parent_indexes',
  },
];
