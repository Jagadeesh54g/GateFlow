import './globals.css'
import Providers from '../components/Providers.jsx'

export const metadata = {
  title: 'GateFlow',
  description: 'Plan. Study. Revise. Crack GATE.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
