import type { CollectionConfig } from 'payload';

export const ContentUpdates: CollectionConfig = {
  slug: 'contentUpdates',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Product Update', value: 'product' },
        { label: 'Price Change', value: 'price' },
        { label: 'New Product', value: 'new' },
        { label: 'Blog Post', value: 'blog' },
        { label: 'Geo Content Update', value: 'geo' },
      ],
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'targetRegions',
      type: 'relationship',
      relationTo: 'geoRegions',
      hasMany: true,
    },
    {
      name: 'publishDate',
      type: 'date',
      required: true,
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      defaultValue: false,
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
      ],
    },
  ],
  timestamps: true,
};
