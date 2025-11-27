import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import PublicDashboard from './pages/PublicDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Tampilkan loading screen sederhana saat session sedang diverifikasi
  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="text-slate-500 font-medium">Memuat Aplikasi...</div>
        </div>
    );
  }

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
                session ? (
                  <AdminDashboard onLogout={handleLogout} />
                ) : (
                  <LoginPage />
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
