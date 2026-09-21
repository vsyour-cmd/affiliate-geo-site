import { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 3600;

export default function HomePage() {
  return (
    <main className="container">
      <div style={{ textAlign: 'center', padding: '4rem 20px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Affiliate Marketplace
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Discover the best products tailored to your region. We curate top affiliate products with localized pricing and content.
        </p>
        <Link href="/products" style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#2563eb',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.375rem',
          fontSize: '1.125rem',
        }}>
          Browse Products
        </Link>
      </div>

      <div style={{ padding: '2rem 0' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', textAlign: 'center' }}>
          Featured Categories
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
          {['Technology', 'Software', 'Courses', 'Finance'].map((category) => (
            <div key={category} style={{
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              textAlign: 'center',
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>{category}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Explore products</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
