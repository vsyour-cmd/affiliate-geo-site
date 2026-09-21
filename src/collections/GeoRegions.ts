import type { CollectionConfig } from 'payload';

export const GeoRegions: CollectionConfig = {
  slug: 'geoRegions',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'countryCode',
      type: 'text',
      required: true,
      maxLength: 2,
    },
    {
      name: 'language',
      type: 'text',
      required: true,
    },
    {
      name: 'currency',
      type: 'select',
      options: [
        { label: 'USD', value: 'USD' },
        { label: 'EUR', value: 'EUR' },
        { label: 'GBP', value: 'GBP' },
        { label: 'CNY', value: 'CNY' },
        { label: 'JPY', value: 'JPY' },
      ],
      required: true,
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Higher priority regions get content first for daily updates',
      },
    },
  ],
};
