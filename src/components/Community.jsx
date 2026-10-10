import { COMMUNITY_INVITE_URL, communityAvailable } from '../lib/profile.js'

const CHANNELS = ['milestones', 'daily-check-ins', 'goals', 'walk-photos', 'small-wins', 'rough-days']
const RULES = [
  'Strictly 18+.',
  'A safe, kind space. No judgment.',
  'No politics, religion, cussing or sexual content.',
]
const Check = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7" /></svg>

// Community page (from You). Links out only: no accounts, no feed. Until COMMUNITY_INVITE_URL is set
// it shows "Coming soon" and a disabled "Invite coming soon" button.
function Community({ onBack }) {
  const open = communityAvailable()
  return (
    <div className="community" data-testid="community">
      <button className="btn btn-ghost back-btn" onClick={onBack}>‹ You</button>
      <header className="page-header">
        <div className="page-header-row">
          <h1 className="page-title">Community{!open && <span className="cm-pill" data-testid="cm-soon">Coming soon</span>}</h1>
        </div>
        <p className="page-tagline">You’re not alone.</p>
      </header>
      <p className="cm-lead">People riding out the same urges, a walk at a time. Connection, goals and quiet support.</p>
      {open ? (
        <>
          <a className="btn btn-primary cm-join" href={COMMUNITY_INVITE_URL} target="_blank" rel="noopener noreferrer" data-testid="cm-join">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" /></svg>
            Join on Discord
          </a>
          <p className="cm-note">Opens Discord · free · strictly 18+</p>
        </>
      ) : (
        <>
          <button type="button" className="btn cm-join cm-join-soon" disabled data-testid="cm-join">Invite coming soon</button>
          <p className="cm-note">We’ll open the doors here once the community is ready. Nothing to sign up for.</p>
        </>
      )}
      <section className="card cm-card" aria-labelledby="cm-inside">
        <h2 className="cm-k" id="cm-inside">What’s inside</h2>
        <ul className="cm-channels">
          {CHANNELS.map((c) => <li key={c}><span aria-hidden="true">#</span> {c}</li>)}
        </ul>
      </section>
      <section className="card cm-card" aria-labelledby="cm-rules">
        <h2 className="cm-k" id="cm-rules">House rules</h2>
        <ul className="cm-rules">
          {RULES.map((r) => <li key={r}><span className="cm-ck"><Check /></span>{r}</li>)}
          <li className="cm-zero"><span className="cm-ck strong"><Check /></span>Zero tolerance for predators: instant ban and report.</li>
        </ul>
      </section>
      <p className="cm-later"><b>Later:</b> share milestone cards and join group goals right from the app.</p>
    </div>
  )
}

export default Community
