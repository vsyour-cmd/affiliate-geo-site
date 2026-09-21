import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt', 'qualityScore', 'monetizable'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'excerpt', type: 'textarea', required: true, maxLength: 240 },
    { name: 'content', type: 'richText', required: true },
    { name: 'relatedProduct', type: 'relationship', relationTo: 'products', required: true },
    { name: 'category', type: 'relationship', relationTo: 'categories' },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'draft',
      options: [{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }, { label: 'Rejected', value: 'rejected' }],
    },
    { name: 'publishedAt', type: 'date' },
    { name: 'automationKey', type: 'text', unique: true, index: true },
    { name: 'aiGenerated', type: 'checkbox', defaultValue: false },
    { name: 'aiModel', type: 'text' },
    { name: 'promptVersion', type: 'text' },
    { name: 'qualityScore', type: 'number', min: 0, max: 100 },
    { name: 'qualityNotes', type: 'array', fields: [{ name: 'note', type: 'text', required: true }] },
    { name: 'sourceSnapshot', type: 'json' },
    { name: 'indexable', type: 'checkbox', defaultValue: true },
    { name: 'monetizable', type: 'checkbox', defaultValue: false },
    { name: 'reviewStatus', type: 'select', defaultValue: 'autoPublished', options: [{ label: 'Auto published', value: 'autoPublished' }, { label: 'Human reviewed', value: 'humanReviewed' }, { label: 'Needs review', value: 'needsReview' }] },
  ],
  timestamps: true,
}
