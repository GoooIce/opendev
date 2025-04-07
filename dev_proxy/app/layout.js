// app/layout.js
import './globals.css';

// This is the Root Layout. It applies to all routes.
// It must define an <html> and <body> tag.

export const metadata = {
  title: 'LLM Proxy Test Interface',
  description: 'API Proxy for various Large Language Models',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <main className="h-full">
          {children}
        </main>
      </body>
    </html>
  );
}

// Optional: Add metadata for SEO
// export const metadata = {
//   title: 'LLM Proxy',
//   description: 'API Proxy for various Large Language Models',
// }; 