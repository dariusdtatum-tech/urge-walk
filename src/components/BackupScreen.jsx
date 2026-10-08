import { useRef, useState } from 'react'
import {
  MAX_FILE_BYTES, applyBackup, backupFilename, buildBackup, getUndoInfo, loadBackupMeta, recordBackup,
  shareOrDownload, summaryText, undoImport, validateBackup,
} from '../lib/backup.js'
import ConfirmDialog from './ConfirmDialog.jsx'

const formatWhen = (iso) => new Date(iso).toLocaleString(undefined, {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
})
const formatDay = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

// Backup screen: export everything to a file, or restore from one.
function BackupScreen({ onBack }) {
  const [meta, setMeta] = useState(() => loadBackupMeta())
  const [undoInfo, setUndoInfo] = useState(() => getUndoInfo())
  const [message, setMessage] = useState(null) // { kind: 'ok' | 'error', text }
  const [pending, setPending] = useState(null) // validated backup waiting for "Replace everything?"
  const [confirmUndo, setConfirmUndo] = useState(false)
  const fileInput = useRef(null)

  async function handleExport() {
    setMessage(null)
    const now = Date.now()
    const text = JSON.stringify(buildBackup(localStorage, now), null, 2)
    try {
      const outcome = await shareOrDownload(text, backupFilename(now))
      if (outcome === 'cancelled') return
      recordBackup(now)
      setMeta(loadBackupMeta())
      setMessage({ kind: 'ok', text: outcome === 'shared' ? 'Backup ready. Make sure you saved it somewhere safe.' : 'Backup file downloaded.' })
    } catch {
      setMessage({ kind: 'error', text: 'Couldn’t create the backup file. Please try again.' })
    }
  }

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = '' // allow choosing the same file again
    setMessage(null)
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setMessage({ kind: 'error', text: 'This file is too large to be an Urge Walk backup.' })
      return
    }
    let text
    try {
      text = await file.text()
    } catch {
      setMessage({ kind: 'error', text: 'Couldn’t read that file.' })
      return
    }
    const result = validateBackup(text)
    if (!result.ok) setMessage({ kind: 'error', text: result.error })
    else setPending(result)
  }

  function handleReplace() {
    const { backup, summary } = pending
    setPending(null)
    if (applyBackup(backup)) {
      setUndoInfo(getUndoInfo())
      setMessage({ kind: 'ok', text: `Backup restored: ${summaryText(summary)}.` })
    } else {
      setMessage({ kind: 'error', text: 'Couldn’t restore the backup on this phone. Nothing was changed.' })
    }
  }

  function handleUndo() {
    setConfirmUndo(false)
    if (undoImport()) {
      setUndoInfo(null)
      setMessage({ kind: 'ok', text: 'Import undone. Your previous data is back.' })
    } else {
      setMessage({ kind: 'error', text: 'Couldn’t undo the import.' })
    }
  }

  return (
    <div className="backup">
      <div className="backup-top">
        <button className="btn btn-ghost back-btn" onClick={onBack}>‹ Home</button>
        <h1 className="page-title">Backup</h1>
      </div>

      <p className="privacy-note">
        <span aria-hidden="true">🔒</span> Your backup file holds everything in the app, including your private
        journal. Keep it somewhere safe, like iCloud Drive or the Files app, and don’t share it.
      </p>

      {message && (
        <p className={message.kind === 'ok' ? 'backup-msg ok' : 'backup-msg error'} role={message.kind === 'ok' ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}

      <section className="backup-card">
        <h3>Export backup</h3>
        <p>Saves your habits, walks, journal and settings to one file. On iPhone, choose “Save to Files”.</p>
        <p className="backup-last" data-testid="last-backup">
          {meta.lastBackupAt ? `Last backup: ${formatWhen(meta.lastBackupAt)}` : 'No backup yet'}
        </p>
        <button className="btn btn-primary btn-big" onClick={handleExport}>Export backup</button>
      </section>

      <section className="backup-card">
        <h3>Restore from a backup</h3>
        <p>Choose a backup file. You’ll see what’s in it before anything changes.</p>
        <button className="btn btn-secondary btn-big" onClick={() => fileInput.current.click()}>Import backup…</button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="visually-hidden"
          aria-label="Backup file"
          data-testid="import-input"
          onChange={handleFile}
        />
        {undoInfo && (
          <div className="undo-row">
            <p>Imported by mistake? Your data from before the last import was saved.</p>
            <button className="btn btn-ghost" onClick={() => setConfirmUndo(true)}>Undo import</button>
          </div>
        )}
      </section>

      {pending && (
        <ConfirmDialog
          title="Replace everything on this phone?"
          message={`This backup has ${summaryText(pending.summary)}, exported ${formatDay(pending.summary.exportedAt)}.` +
            (pending.summary.skipped ? ` ${pending.summary.skipped} damaged item(s) will be skipped.` : '') +
            ' Everything currently on this phone will be replaced. A safety copy is kept so you can undo.'}
          confirmLabel="Replace everything"
          onCancel={() => setPending(null)}
          onConfirm={handleReplace}
        />
      )}
      {confirmUndo && (
        <ConfirmDialog
          title="Undo the last import?"
          message={`This puts back the data that was on this phone before the import${undoInfo?.savedAt ? ` (${formatWhen(undoInfo.savedAt)})` : ''}.`}
          confirmLabel="Undo import"
          danger={false}
          onCancel={() => setConfirmUndo(false)}
          onConfirm={handleUndo}
        />
      )}
    </div>
  )
}

export default BackupScreen
