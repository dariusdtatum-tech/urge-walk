import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SupportStep } from '../components/OnboardingSteps.jsx'
import WalkActive from '../components/WalkActive.jsx'
import { communityAvailable } from './profile.js'
import { startWalk } from './walkTimer.js'

describe('onboarding: Who’s with you', () => {
  const html = renderToStaticMarkup(<SupportStep value={{ support: null, trustedName: '', trustedPhone: '' }} onChange={() => {}} />)
  it('never shows a “Coming soon” placeholder', () => {
    expect(html).not.toMatch(/Coming soon/)
    if (!communityAvailable()) expect(html).not.toContain('support-community')
  })
})

describe('live walk controls', () => {
  const walk = startWalk(10, 0, { id: 'w', messageOffset: 0 })
  const html = renderToStaticMarkup(<WalkActive walk={walk} now={1000} onPause={() => {}} onResume={() => {}} onFinish={() => {}} onExtend={() => {}} />)
  it('puts Pause and +5 min right under Finish, and Cancel last and apart', () => {
    const finish = html.indexOf('Finish walk'), pause = html.indexOf('>Pause<'), plus = html.indexOf('+5'), cancel = html.indexOf('Cancel walk')
    expect(finish).toBeGreaterThan(-1)
    expect(pause).toBeGreaterThan(finish)
    expect(plus).toBeGreaterThan(pause)
    expect(cancel).toBeGreaterThan(plus)
    expect(html.slice(html.indexOf('walk-controls'), cancel)).toContain('</div>')
  })
})
