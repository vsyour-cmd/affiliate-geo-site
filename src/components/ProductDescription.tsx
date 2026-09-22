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
  const headingMatch = text.match(/^(Länderlinks|Country links|Regional links|Liens pays|Enlaces por país)\s+/i)
  if (!headingMatch) return null

  const content = text.slice(headingMatch[0].length)
  const urls = [...content.matchAll(/https:\/\/[^\s]+/g)]
  if (urls.length < 2) return null

  let previousEnd = 0
  const links = urls.map((match) => {
    const start = match.index ?? 0
    const label = content.slice(previousEnd, start).trim().replace(/^[-–—]\s*/, '')
    const rawURL = match[0]
    const url = rawURL.replace(/[),.;]+$/, '')
    previousEnd = start + rawURL.length
    return { label, url }
  }).filter((link) => link.label)

  return links.length >= 2 ? { heading: headingMatch[1], links } : null
}

function ProductSection({ text, index }: { text: string; index: number }) {
  const linkSection = countryLinks(text)
  if (linkSection) {
    return (
      <section className="product-copy-section">
        <div className="product-copy-index" aria-hidden="true">{String(index).padStart(2, '0')}</div>
        <div className="product-copy-content">
          <h3>{linkSection.heading}</h3>
          <ul className="product-link-list">{linkSection.links.map((link) => <li key={link.url}><span>{link.label}</span><a href={link.url} target="_blank" rel="noopener noreferrer nofollow">Open link ↗</a></li>)}</ul>
        </div>
      </section>
    )
  }

  const hyphenParts = text.split(/\s+-\s+(?=[\p{L}\p{N}])/u).map((item) => item.trim()).filter(Boolean)
  const numberedParts = text.split(/\s+(?=\d+\.\s)/).map((item) => item.trim()).filter(Boolean)
  const parts = hyphenParts.length > 1 ? hyphenParts : numberedParts.length > 1 ? numberedParts : [text]
  const { heading, body } = headingAndBody(parts[0])

  return (
    <section className="product-copy-section">
      <div className="product-copy-index" aria-hidden="true">{String(index).padStart(2, '0')}</div>
      <div className="product-copy-content">
        <h3>{heading}</h3>
        {body ? <p>{linkedText(body)}</p> : null}
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
