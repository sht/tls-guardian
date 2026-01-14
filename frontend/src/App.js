import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ApplicationDetail from './pages/ApplicationDetail';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/application/:id" element={<ApplicationDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
