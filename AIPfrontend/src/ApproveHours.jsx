import { useEffect, useState } from 'react';

function ApproveHours() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const email = localStorage.getItem('userEmail');

  useEffect(() => {
    if (!email) {
      setError('No user logged in.');
      return;
    }

    const fetchRequests = async () => {
      try {
        const res = await fetch(`http://localhost:8080/requests/${email}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchRequests();
  }, [email]);

  const approveRequest = async (requesterEmail, hours, requestId) => {
    try {
      const updateRes = await fetch(
        `http://localhost:8080/users/${requesterEmail}/add/${hours}`,
        { method: 'PUT' }
      );
      if (!updateRes.ok) throw new Error(await updateRes.text());

      const deleteRes = await fetch(`http://localhost:8080/remove/${requestId}`);
      if (!deleteRes.ok) throw new Error(await deleteRes.text());

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setMessage(`Approved ${hours} hours for ${requesterEmail}`);
    } catch (err) {
      setMessage(`Failed to approve: ${err.message}`);
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      const res = await fetch(`http://localhost:8080/remove/${requestId}`);
      if (!res.ok) throw new Error(await res.text());

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setMessage(`Rejected request ID ${requestId}`);
    } catch (err) {
      setMessage(`Failed to reject: ${err.message}`);
    }
  };

  if (error) {
    return (
      <div style={{ textAlign: 'center', color: 'red', marginTop: '2rem' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 0 15px rgba(0,0,0,0.15)',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color:'black' }}>Hours Approval Requests</h2>
        {message && <p style={{ color: 'black', marginBottom: '1rem' }}>{message}</p>}

        {requests.length === 0 ? (
          <p>No requests to approve.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {requests.map((req) => (
              <li key={req.id} style={{
                border: '1px solid #ccc',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                textAlign: 'left',
                color: 'black'
              }}>
                <p><strong>Requester:</strong> {req.requester} ({req.name})</p>
                <p><strong>Hours:</strong> {req.hours}</p>
                <p><strong>Description:</strong> {req.description}</p>
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    onClick={() => approveRequest(req.requester, req.hours, req.id)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '1rem',
                      marginRight: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectRequest(req.id)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '1rem',
                      backgroundColor: 'red',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ApproveHours;