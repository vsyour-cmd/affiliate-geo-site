import type { ReactNode } from 'react'

type RichNode = { text?: unknown; children?: unknown }

function extractText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const node = value as RichNode
  const ownText = typeof node.text === 'string' ? node.text : ''
  const childText = Array.isArray(node.children) ? node.children.map(extractText).join(' ') : ''
  if ('root' in value) return extractText((value as { root?: unknown }).root)
  return `${ownText} ${childText}`.replace(/\s+/g, ' ').trim()
}

function linkedText(text: string): ReactNode[] {
  const parts = text.split(/(https:\/\/[^\s]+)/g)
  return parts.filter(Boolean).map((part, index) => {
    if (!part.startsWith('https://')) return part
    const cleanURL = part.replace(/[),.;]+$/, '')
    const suffix = part.slice(cleanURL.length)
    return <span key={`${cleanURL}-${index}`}><a href={cleanURL} target="_blank" rel="noopener noreferrer nofollow">{cleanURL}</a>{suffix}</span>
  })
}

function headingAndBody(prefix: string) {
  const words = prefix.trim().split(/\s+/)
  if (words.length <= 9) return { heading: prefix.trim(), body: '' }
  const headingWords = words.slice(0, Math.min(8, words.length))
  return { heading: headingWords.join(' ').replace(/[.:,;]$/, ''), body: words.slice(headingWords.length).join(' ') }
}

function countryLinks(text: string) {
  const matches = [...text.matchAll(/([^\s][^]*?)\s+(https:\/\/[^\s]+)/g)]
  if (matches.length < 2) return null
  return matches.map((match) => ({ label: match[1].trim().replace(/^[-–—]\s*/, ''), url: match[2].replace(/[),.;]+$/, '') }))
}

function ProductSection({ text, index }: { text: string; index: number }) {
  const hyphenParts = text.split(/\s+-\s+(?=[\p{L}\p{N}])/u).map((item) => item.trim()).filter(Boolean)
  const numberedParts = text.split(/\s+(?=\d+\.\s)/).map((item) => item.trim()).filter(Boolean)
  const parts = hyphenParts.length > 1 ? hyphenParts : numberedParts.length > 1 ? numberedParts : [text]
  const { heading, body } = headingAndBody(parts[0])
  const links = parts.length === 1 ? countryLinks(body || text) : null

  return (
    <section className="product-copy-section">
      <div className="product-copy-index" aria-hidden="true">{String(index).padStart(2, '0')}</div>
      <div className="product-copy-content">
        <h3>{heading}</h3>
        {body && !links ? <p>{linkedText(body)}</p> : null}
        {links ? <ul className="product-link-list">{links.map((link) => <li key={link.url}><span>{link.label}</span><a href={link.url} target="_blank" rel="noopener noreferrer nofollow">Open link ↗</a></li>)}</ul> : null}
        {parts.length > 1 ? <ul className="product-fact-list">{parts.slice(1).map((item, itemIndex) => <li key={`${item.slice(0, 40)}-${itemIndex}`}>{linkedText(item.replace(/^\d+\.\s*/, ''))}</li>)}</ul> : null}
      </div>
    </section>
  )
}

export function ProductDescription({ data }: { data: unknown }) {
  const text = extractText(data)
  if (!text) return null
  const sections = text.split(/\s+---\s+/).map((item) => item.trim()).filter(Boolean)
  if (sections.length === 1) return <div className="product-copy"><p className="product-copy-intro">{linkedText(text)}</p></div>

  return (
    <div className="product-copy">
      <p className="product-copy-intro">{linkedText(sections[0])}</p>
      {sections.slice(1).map((section, index) => <ProductSection key={`${section.slice(0, 40)}-${index}`} text={section} index={index + 1} />)}
    </div>
  )
}
