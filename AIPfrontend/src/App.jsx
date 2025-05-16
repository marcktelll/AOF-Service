import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import SendHours from './SendHours';
import ApproveHours from './ApproveHours';

function App() {
  return (
    <BrowserRouter> // create a  router
      <Routes>
        <Route path="/" element={<Login />} /> // path to login page
        <Route path="/send-hours" element={<SendHours />} /> // path to sendHours page
        <Route path="/approve-hours" element={<ApproveHours />} /> // path to approve hours page
      </Routes>
    </BrowserRouter>
  );
}

export default App;
