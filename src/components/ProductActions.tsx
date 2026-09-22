'use client'

import { useEffect, useState } from 'react'

type Labels = { save: string; saved: string; share: string; copied: string }

export function ProductActions({ slug, title, labels }: { slug: string; title: string; labels: Labels }) {
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const key = `saved-product:${slug}`

  useEffect(() => {
    // Restore the browser-only preference after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(localStorage.getItem(key) === '1')
  }, [key])

  function toggleSaved() {
    const next = !saved
    setSaved(next)
    if (next) localStorage.setItem(key, '1')
    else localStorage.removeItem(key)
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title, url: window.location.href }).catch(() => undefined)
      return
    }
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return <div className="product-actions" aria-live="polite">
    <button type="button" className={saved ? 'action-button is-active' : 'action-button'} aria-pressed={saved} onClick={toggleSaved}>{saved ? '♥' : '♡'} {saved ? labels.saved : labels.save}</button>
    <button type="button" className="action-button" onClick={share}>{copied ? '✓' : '↗'} {copied ? labels.copied : labels.share}</button>
  </div>
}
