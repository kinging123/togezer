import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function InviteRedirect() {
  const { query } = useRouter()
  const code = query.code as string

  useEffect(() => {
    if (!code) return
    window.location.href = `togezer://j/${code}`
    setTimeout(() => {
      window.location.href = 'https://apps.apple.com/app/togezer/id000000000'
    }, 2000)
  }, [code])

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', marginTop: 80 }}>
      <h1>Opening togezer…</h1>
      <p>If nothing happens, <a href="https://apps.apple.com/app/togezer/id000000000">download the app</a>.</p>
    </div>
  )
}
