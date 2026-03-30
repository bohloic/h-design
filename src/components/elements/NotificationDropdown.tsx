import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCircle2, AlertCircle, Info, X, Trash2, ArrowRight } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface MonTokenCustom {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  let currentUserId = '';
  if (token) {
    try {
      const decoded = jwtDecode<MonTokenCustom>(token);
      currentUserId = String(decoded.userId);
    } catch {}
  }

  const { notifications, getUnreadCount, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();
  const unreadCount = getUnreadCount(currentUserId);

  const userNotifications = notifications.filter(n => !n.userId || String(n.userId) === currentUserId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'info':
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
      setIsOpen(false);
    }
  };

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "À l'instant";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days} j`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-pure rounded-full transition-colors relative focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 w-auto max-w-[380px] sm:w-96 mx-auto sm:mx-0 bg-white dark:bg-carbon rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-pure flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); markAllAsRead(currentUserId); }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-pure transition-colors flex items-center gap-1"
              >
                Tout lire <Check size={14} />
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {userNotifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                </div>
                <p className="font-semibold text-slate-900 dark:text-pure">Aucune notification</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Vous êtes à jour !</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {userNotifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 flex gap-3 group relative cursor-pointer ${notif.read ? 'opacity-70' : 'bg-slate-100 dark:bg-slate-900/30'}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    {!notif.read && (
                      <div className="absolute top-1/2 -left-0.5 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
                    )}
                    
                    <div className="mt-0.5 shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-sm ${notif.read ? 'font-medium text-slate-500 dark:text-slate-400' : 'font-bold text-slate-900 dark:text-pure'} truncate`}>
                        {notif.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-snug">
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                        {timeAgo(notif.date)}
                      </p>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                      className="absolute right-4 top-4 p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-center transition-colors">
            <Link 
              to="/dashboard" 
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-pure flex items-center gap-1 transition-colors"
            >
              Aller à mon compte <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
