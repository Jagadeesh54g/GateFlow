import './globals.css'

export const metadata = {
  title: 'GateFlow',
  description: 'Plan. Study. Revise. Crack GATE.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
