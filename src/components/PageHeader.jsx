// Large page title (iOS style) with an optional action on the right and an optional tagline.
function PageHeader({ title, tagline, action }) {
  return (
    <header className="page-header">
      <div className="page-header-row">
        <h1 className="page-title">{title}</h1>
        {action}
      </div>
      {tagline && <p className="page-tagline">{tagline}</p>}
    </header>
  )
}

export default PageHeader
