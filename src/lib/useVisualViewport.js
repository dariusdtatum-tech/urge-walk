import { useEffect, useState } from 'react'

// The part of the screen that's actually visible. On iPhone, the keyboard covers the
// bottom of the page without resizing it, so full-screen views size themselves to this
// instead — that keeps the text area above the keyboard.
export function useVisualViewport() {
  const read = () => {
    const vv = window.visualViewport
    return vv ? { height: vv.height, offsetTop: vv.offsetTop } : null
  }
  const [box, setBox] = useState(read)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return undefined
    const update = () => setBox(read())
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return box
}
