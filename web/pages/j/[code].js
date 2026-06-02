import { useEffect } from 'react'

// getServerSideProps forces Vercel to register a route/function for the dynamic
// [code] segment. Without a data method, the auto-static-optimized dynamic page
// wasn't being matched (404 NOT_FOUND) for arbitrary codes.
export async function getServerSideProps({ params }) {
  return { props: { code: params?.code ?? null } }
}

export default function InviteRedirect({ code }) {
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
