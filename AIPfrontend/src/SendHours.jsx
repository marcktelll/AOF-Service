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
    <div className="send-hours-container">
      <h2>Welcome{user ? `, ${user.name}` : ''}!</h2>
      <p><strong>Total Hours:</strong> {user?.hours ?? 'Loading...'}</p>

      <h3>Submit Hours</h3>
      <input
        name="verifier"
        placeholder="Verifier Email"
        value={form.verifier}
        onChange={handleChange}
      /><br />
      <input
        name="hours"
        placeholder="Hours"
        value={form.hours}
        onChange={handleChange}
      /><br />
      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
      /><br />
      <button onClick={sendHours} disabled={loading}>
        {loading ? 'Sending...' : 'Submit'}
      </button>

      {response && <p>{response}</p>}
    </div>
  );
}

export default SendHours;