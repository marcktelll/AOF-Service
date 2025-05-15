import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import SendHours from './SendHours';
import ApproveHours from './ApproveHours';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/send-hours" element={<SendHours />} />
        <Route path="/approve-hours" element={<ApproveHours />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;