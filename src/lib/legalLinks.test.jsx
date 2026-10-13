import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import LegalLinks from '../components/LegalLinks.jsx'

describe('LegalLinks', () => {
  const html = renderToStaticMarkup(<LegalLinks />)
  it('renders Privacy policy and Support with the right hrefs, opening in a new tab', () => {
    expect(html).toMatch(/<a href="https:\/\/dariusdtatum-tech\.github\.io\/urgewalk\/privacy\.html" target="_blank" rel="noopener noreferrer">Privacy policy<\/a>/)
    expect(html).toMatch(/<a href="https:\/\/dariusdtatum-tech\.github\.io\/urgewalk\/support\.html" target="_blank" rel="noopener noreferrer">Support<\/a>/)
  })
})
