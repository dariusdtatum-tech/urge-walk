import { useRef, useState } from 'react'
import { cleanTime, cleanTimeLabel, dailyLine, milestoneCards, sinceLabel } from '../lib/homeIdeas.js'
import { useMinuteNow } from '../lib/useToday.js'
import HeroRing from './HeroRing.jsx'

// Home hero, two swipeable pages: 1 = the milestone ring (+ label and the daily line),
// 2 = clean time (days and hours, updated each minute) with the last and next milestone cards.
function HeroPager({ hero, days, since, segment, label, milestones, today, profile }) {
  const [page, setPage] = useState(0)
  const track = useRef(null)
  const now = useMinuteNow()
  const ct = cleanTime(hero, now)
  const cards = milestoneCards(hero, milestones, today)
  const line = dailyLine(profile, today)

  function go(i) {
    setPage(i)
    track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  function onScroll(e) {
    const el = e.currentTarget
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
    if (i !== page) setPage(i)
  }

  return (
    <div className="hero-block">
      <div className="hero-pager" ref={track} onScroll={onScroll} data-testid="hero-pager"
        aria-roledescription="carousel" aria-label="Clean days">
        <div className="hero-page" aria-hidden={page !== 0} aria-roledescription="slide" aria-label="Milestone ring">
          <HeroRing name={hero.name} days={days} caption={since} progress={segment.progress} celebrate={segment.isToday} />
        </div>
        <div className="hero-page clean-time" aria-hidden={page !== 1} aria-roledescription="slide" data-testid="clean-time">
          <p className="ct-kicker">{hero.name} · clean for</p>
          <p className="ct-time" aria-label={cleanTimeLabel(ct)} data-testid="clean-time-value">
            <span className="ct-row" aria-hidden="true"><b>{ct.days.toLocaleString()}</b> {ct.days === 1 ? 'day' : 'days'}</span>
            <span className="ct-row ct-hours" aria-hidden="true"><b>{ct.hours}</b> {ct.hours === 1 ? 'hour' : 'hours'}</span>
          </p>
          <p className="ct-since">since {sinceLabel(hero)}</p>
        </div>
      </div>
      <div className="pager-dots" role="tablist" aria-label="Home ring pages">
        {['Milestone ring', 'Clean time'].map((name, i) => (
          <button key={name} type="button" role="tab" aria-selected={page === i} aria-label={name}
            className={page === i ? 'pager-dot on' : 'pager-dot'} onClick={() => go(i)} />
        ))}
      </div>

      {page === 0 ? (
        <>
          <p className="ring-label" data-testid="ring-label"><b>{label.lead}</b><span>{label.rest}</span></p>
          {line.text && (
            <figure className="daily-line" data-testid="daily-line" data-source={line.source}>
              <blockquote>“{line.text.replace(/[.]?$/, '.')}”</blockquote>
              <figcaption>{line.caption}</figcaption>
            </figure>
          )}
        </>
      ) : (
        <div className="ms-cards" data-testid="milestone-cards">
          <div className="ms-card" data-testid="ms-last">
            <div className="ms-card-top">
              <p className="ms-card-k">Last milestone</p>
              {cards.last && <span className="badge-sm" aria-hidden="true">{cards.last.short}</span>}
            </div>
            {cards.last ? (
              <>
                <p className="ms-card-name">{cards.last.name}</p>
                <p className="ms-card-date">{cards.last.dateLabel}{cards.last.earlier ? ' · earlier count' : ''}</p>
              </>
            ) : (
              <><p className="ms-card-name">Not yet</p><p className="ms-card-date">Your first is 7 days</p></>
            )}
          </div>
          <div className="ms-card" data-testid="ms-next">
            <div className="ms-card-top">
              <p className="ms-card-k">Next milestone</p>
              <span className="badge-sm next" aria-hidden="true">{cards.next.short}</span>
            </div>
            <p className="ms-card-name">{cards.next.name}</p>
            <p className="ms-card-date">{cards.next.dateLabel}</p>
            <div className="ms-bar" role="progressbar" aria-label={`Progress to ${cards.next.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(cards.next.progress * 100)}>
              <i style={{ width: `${Math.round(cards.next.progress * 100)}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HeroPager
