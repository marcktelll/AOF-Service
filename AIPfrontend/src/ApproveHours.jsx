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
      // First, add the hours
      const updateRes = await fetch(
        `http://localhost:8080/users/${requesterEmail}/add/${hours}`,
        { method: 'PUT' }
      );
      if (!updateRes.ok) throw new Error(await updateRes.text());

      // Then, remove the request
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

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!requests.length) return <p>No requests to approve.</p>;

  return (
    <div>
      <h2>Hours Approval Requests</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <ul>
        {requests.map((req) => (
          <li key={req.id} style={{ marginBottom: '1rem' }}>
            <p><strong>Requester:</strong> {req.requester} ({req.name})</p>
            <p><strong>Hours:</strong> {req.hours}</p>
            <p><strong>Description:</strong> {req.description}</p>
            <button onClick={() => approveRequest(req.requester, req.hours, req.id)}>
              Approve
            </button>
            <button
              onClick={() => rejectRequest(req.id)}
              style={{ marginLeft: '0.5rem', backgroundColor: 'red', color: 'white' }}
            >
              Reject
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ApproveHours;