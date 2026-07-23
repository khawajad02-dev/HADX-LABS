export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050505',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '2.5rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '10px' }}>
        HADX LABS
      </h1>
      <p style={{ color: '#888888', fontSize: '1rem', letterSpacing: '1px' }}>
        System Preview Active • All Nodes Operational
      </p>
    </main>
  );
}
