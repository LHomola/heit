import { useState } from 'react'
import Login from './pages/Login'

function App() {
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  const callBackend = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setResponse(data)
    } catch (err) {
      setError('Could not reach the backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Arial' }}>
      {/* Health check*/}
      <div style={{ padding: '1rem 2rem', background: '#f8f8f8', borderBottom: '1px solid #ddd' }}>
        <strong>Health check:</strong>{' '}
        <button onClick={callBackend} disabled={loading}>
          {loading ? 'Calling...' : 'Ping Backend'}
        </button>
        {response && <code style={{ marginLeft: '1rem' }}>{JSON.stringify(response)}</code>}
        {error && <span style={{ color: 'red', marginLeft: '1rem' }}>{error}</span>}
      </div>

      {/* Login form */}
      <Login onLogin={(user) => setCurrentUser(user)} />

      {currentUser && (
        <p style={{ textAlign: 'center', color: '#888' }}>
          Logged in as <strong>{currentUser.full_name}</strong> ({currentUser.role})
        </p>
      )}
    </div>
  )
}

export default App