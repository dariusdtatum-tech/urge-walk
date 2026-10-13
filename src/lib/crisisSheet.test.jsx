import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CrisisSheet from '../components/CrisisSheet.jsx'

describe('CrisisSheet', () => {
  const html = renderToStaticMarkup(<CrisisSheet onClose={() => {}} />)
  it('links 988 (call + text), SAMHSA and 911', () => {
    expect(html).toContain('href="tel:988"')
    expect(html).toContain('href="sms:988"')
    expect(html).toContain('href="tel:18006624357"')
    expect(html).toContain('1-800-662-4357')
    expect(html).toContain('href="tel:911"')
  })
  it('says Urge Walk is a habit tool, not treatment', () => {
    expect(html).toMatch(/habit tool, not treatment/)
  })
})
