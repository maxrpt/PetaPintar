import React, { useState } from 'react';
import { Lock, User, KeyRound, AlertCircle, AlertTriangle } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isConfirmed = window.confirm(
      "🔒 AKSES ADMINISTRATOR\n\nAnda akan memasuki halaman pengelolaan data sensitif.\nPastikan Anda memiliki wewenang untuk melanjutkan.\n\nLanjutkan login?"
    );

    if (!isConfirmed) return;

    if (username === 'NM Rantau' && password === 'Agent-03') {
      setError('');
      onLogin();
    } else {
      setError('Username atau Password salah!');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-800 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Login</h2>
          <p className="text-indigo-200 text-sm mt-1">Silakan masuk untuk mengelola peta</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
             <div>
                <h4 className="text-xs font-bold text-amber-800 uppercase">Perhatian</h4>
                <p className="text-xs text-amber-700 mt-1">
                  Area ini dipantau. Pastikan koneksi internet stabil sebelum melakukan input data.
                </p>
             </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors bg-white"
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-95"
          >
            Masuk Dashboard
          </button>
        </form>
        
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Akses terbatas hanya untuk administrator PetaPintar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;