import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface NotificationToastProps {
  show: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ show, message, type, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Hilang otomatis setelah 4 detik
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const isSuccess = type === 'success';

  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      bgColor: 'bg-emerald-50 border-emerald-200',
      textColor: 'text-emerald-800',
      progressBg: 'bg-emerald-200',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-rose-500" />,
      bgColor: 'bg-rose-50 border-rose-200',
      textColor: 'text-rose-800',
      progressBg: 'bg-rose-200',
    }
  };

  const theme = config[type];

  return (
    <div 
      className={`fixed top-20 right-4 z-[3000] w-full max-w-sm p-4 rounded-xl shadow-2xl border flex items-start gap-3 transition-all transform animate-fade-in-up ${theme.bgColor}`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {theme.icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${theme.textColor}`}>
          {isSuccess ? 'Berhasil!' : 'Terjadi Kesalahan'}
        </p>
        <p className={`text-xs mt-1 ${theme.textColor}`}>
          {message}
        </p>
      </div>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5">
        <X className={`w-4 h-4 ${theme.textColor}`} />
      </button>
      <div className="absolute bottom-0 left-0 h-1 w-full bg-black/5 overflow-hidden rounded-b-xl">
        <div className={`h-full ${theme.progressBg} animate-progress`}></div>
      </div>
      {/* FIX: Replaced non-standard styled-jsx syntax with a standard style tag for CSS animation. */}
      <style>
        {`
        @keyframes progress-bar {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress {
          animation: progress-bar 4s linear forwards;
        }
      `}
      </style>
    </div>
  );
};

export default NotificationToast;
