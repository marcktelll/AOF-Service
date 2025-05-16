import { useEffect, useState } from 'react';

function ApproveHours() {
  // State for holding requests to approve
  const [requests, setRequests] = useState([]);
  // State for error messages 
  const [error, setError] = useState('');
  // State for user feedback messages
  const [message, setMessage] = useState('');
  // Retrieve logged-in user's email from local storage
  const email = localStorage.getItem('userEmail');

  // Fetch approval requests when component mounts or email changes
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
        setRequests(data); // Store requests in state
      } catch (err) {
        setError(err.message); // Handle fetch error
      }
    };

    fetchRequests();
  }, [email]);

  // Function to approve a request
  const approveRequest = async (requesterEmail, hours, requestId) => {
    try {
      // Add hours to the user
      const updateRes = await fetch(
        `http://localhost:8080/users/${requesterEmail}/add/${hours}`,
        { method: 'PUT' }
      );
      if (!updateRes.ok) throw new Error(await updateRes.text());

      // Remove the request after approval
      const deleteRes = await fetch(`http://localhost:8080/remove/${requestId}`);
      if (!deleteRes.ok) throw new Error(await deleteRes.text());

      // Update UI: remove request from list and show success message
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setMessage(`Approved ${hours} hours for ${requesterEmail}`);
    } catch (err) {
      setMessage(`Failed to approve: ${err.message}`);
    }
  };

  // Function to reject a request
  const rejectRequest = async (requestId) => {
    try {
      const res = await fetch(`http://localhost:8080/remove/${requestId}`);
      if (!res.ok) throw new Error(await res.text());

      // Update UI: remove request and show rejection message
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setMessage(`Rejected request ID ${requestId}`);
    } catch (err) {
      setMessage(`Failed to reject: ${err.message}`);
    }
  };

  // Display error if something went wrong
  if (error) {
    return (
      <div style={{ textAlign: 'center', color: 'red', marginTop: '2rem' }}>
        {error}
      </div>
    );
  }

  // Main render
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

        {/* Display any feedback messages */}
        {message && <p style={{ color: 'black', marginBottom: '1rem' }}>{message}</p>}

        {/* Show message if there are no requests */}
        {requests.length === 0 ? (
          <p>No requests to approve.</p>
        ) : (
          // Render list of requests
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

                {/* Approve and Reject buttons */}
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
