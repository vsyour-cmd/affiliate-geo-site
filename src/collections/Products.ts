import type { CollectionConfig } from 'payload';

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'status', 'geoRegions'],
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
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'shortDescription',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 160,
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'affiliateUrl',
      type: 'text',
      required: true,
    },
    {
      name: 'commissionRate',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
    },
    {
      name: 'pricing',
      type: 'group',
      fields: [
        {
          name: 'amount',
          type: 'number',
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
          defaultValue: 'USD',
        },
      ],
    },
    {
      name: 'geoRegions',
      type: 'relationship',
      relationTo: 'geoRegions',
      hasMany: true,
      required: true,
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'alt',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'features',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'description',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'reviewScore',
      type: 'number',
      min: 0,
      max: 5,
      required: true,
    },
    {
      name: 'lastUpdated',
      type: 'date',
      required: true,
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
          maxLength: 60,
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          maxLength: 160,
        },
        {
          name: 'keywords',
          type: 'text',
          localized: true,
        },
        {
          name: 'canonical',
          type: 'text',
        },
      ],
    },
    {
      name: 'geoContent',
      type: 'array',
      fields: [
        {
          name: 'region',
          type: 'relationship',
          relationTo: 'geoRegions',
          required: true,
        },
        {
          name: 'localizedName',
          type: 'text',
          localized: true,
        },
        {
          name: 'localizedDescription',
          type: 'richText',
          localized: true,
        },
        {
          name: 'localizedPrice',
          type: 'number',
        },
        {
          name: 'localizedCurrency',
          type: 'text',
        },
      ],
    },
  ],
  timestamps: true,
};
