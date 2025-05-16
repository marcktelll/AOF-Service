import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/aof-logo.jpeg'; // Adjust path as needed

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const login = async () => {
    try {
      const res = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(await res.text());

      const user = await res.json();
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userStatus', user.status);

      // Redirect based on user status
      if (user.status === 1) {
        navigate('/send-hours');
      } else if (user.status === 2) {
        navigate('/approve-hours');
      } else {
        alert('Unknown user status');
      }
    } catch (err) {
      setError(err.message);
    }
  };

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
        width: '320px',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <img
          src={logo}
          alt="AOF Logo"
          style={{
            width: '80px',
            height: 'auto',
            marginBottom: '1rem'
          }}
        />

        {/* Title */}
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color:'black' }}>Login</h2>

        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={{
            marginBottom: '1rem',
            padding: '10px',
            width: '100%',
            fontSize: '1.2rem'
          }}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          style={{
            marginBottom: '1.5rem',
            padding: '10px',
            width: '100%',
            fontSize: '1.2rem'
          }}
        />
        <button
          onClick={login}
          style={{
            padding: '12px 24px',
            fontSize: '1.2rem',
            width: '100%',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Login;