import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import PublicDashboard from './pages/PublicDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';

const App = () => {
  // Simple auth state management
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 relative">
          <Routes>
            <Route path="/" element={<PublicDashboard />} />
            <Route 
              path="/admin" 
              element={
                isAuthenticated ? (
                  <AdminDashboard onLogout={handleLogout} />
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              } 
            />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;