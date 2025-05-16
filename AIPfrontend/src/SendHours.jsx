import { useEffect, useState } from 'react';

function SendHours() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    requester: '',
    verifier: '',
    name: '',
    hours: '',
    description: '',
  });
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      setError('No user email found.');
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:8080/users/${email}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setUser(data);
        setForm(prev => ({
          ...prev,
          requester: data.email,
          name: data.name,
        }));
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendHours = async () => {
    if (!form.verifier || !form.hours || !form.description) {
      setResponse('Please fill in all fields.');
      return;
    }

    const parsedHours = Number(form.hours);
    if (isNaN(parsedHours)) {
      setResponse('Hours must be a number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/sendHours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, hours: parsedHours }),
      });

      if (!res.ok) throw new Error(await res.text());
      await res.json();
      setResponse('Hours submitted successfully.');
    } catch (err) {
      setResponse(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f5f5f5',
      fontSize: '1.2rem'
    }}>
      <div style={{
        padding: '2.5rem',
        border: '1px solid #ccc',
        borderRadius: '10px',
        backgroundColor: '#fff',
        boxShadow: '0 0 15px rgba(0,0,0,0.15)',
        width: '400px',
        textAlign: 'center',
        color: 'black'
      }}>
        <h2>Welcome{user ? `, ${user.name}` : ''}!</h2>
        <p><strong>Total Hours:</strong> {user?.hours ?? 'Loading...'}</p>

        <h3>Submit Hours</h3>
        <input
          name="verifier"
          placeholder="Verifier Email"
          value={form.verifier}
          onChange={handleChange}
          style={{ marginBottom: '1rem', padding: '10px', width: '100%', fontSize: '1rem' }}
        />
        <input
          name="hours"
          placeholder="Hours"
          value={form.hours}
          onChange={handleChange}
          style={{ marginBottom: '1rem', padding: '10px', width: '100%', fontSize: '1rem' }}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          style={{ marginBottom: '1.5rem', padding: '10px', width: '100%', fontSize: '1rem' }}
        />
        <button
          onClick={sendHours}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            width: '100%',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Sending...' : 'Submit'}
        </button>

        {response && <p style={{ marginTop: '1rem', color: response.startsWith('Error') ? 'red' : 'green' }}>{response}</p>}
      </div>
    </div>
  );
}

export default SendHours;