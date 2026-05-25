import { IDSProvider } from './lib/IDSContext'
import './globals.css'

export const metadata = {
  title:       'DarkCyberWatch — IDS',
  description: 'ML-powered Network Intrusion Detection System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* IDSProvider wraps ALL pages — state never resets on navigation */}
        <IDSProvider>
          {children}
        </IDSProvider>
      </body>
    </html>
  )
}
