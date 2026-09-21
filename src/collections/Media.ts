import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'width',
      type: 'number',
    },
    {
      name: 'height',
      type: 'number',
    },
    {
      name: 'filesize',
      type: 'number',
    },
    {
      name: 'filename',
      type: 'text',
    },
  ],
};
