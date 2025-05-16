import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/aof-logo.jpeg'; // Logo image

function Login() {
  // State to track form input values
  const [form, setForm] = useState({ email: '', password: '' });
  // State to handle error messages
  const [error, setError] = useState('');
  // Hook to programmatically navigate between routes
  const navigate = useNavigate();

  // Handle input changes and update state
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Login function to authenticate user
  const login = async () => {
    try {
      const res = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      // If login failed, throw an error 
      if (!res.ok) throw new Error(await res.text());

      const user = await res.json();

      // Store user email and status in local storage
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userStatus', user.status);

      // Navigate based on user role
      if (user.status === 1) {
        navigate('/send-hours'); // Volunteer
      } else if (user.status === 2) {
        navigate('/approve-hours'); //  approver
      } else {
        alert('Unknown user status'); // Fallback
      }
    } catch (err) {
      // Display error message
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

        {/* Form title */}
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color:'black' }}>Login</h2>

        {/* Error message */}
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        {/* Email input */}
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

        {/* Password input */}
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

        {/* Login button */}
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
