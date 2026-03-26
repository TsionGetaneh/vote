export const metadata = {
  title: 'Voting DApp',
  description: 'Decentralized voting platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}