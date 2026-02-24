
import React from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, Map as MapIcon, Plus, Settings } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 overflow-x-hidden">
            {/* Header - Only show on Dashboard */}
            <Header />

            {/* Main Content */}
            <main className="flex-1 pb-28 max-w-5xl mx-auto w-full relative z-0">
                {children}
            </main>

            {/* Bottom Nav */}
            <BottomNav />
        </div>
    );
};

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { language, setLanguage, t } = useLanguage();
    
    // Don't show the main header on detail/edit pages
    if (location.pathname !== '/') return null;

    const toggleLanguage = () => {
        setLanguage(language === 'ro' ? 'de' : 'ro');
    };

    return (
        <header className="sticky top-0 z-30 px-6 pt-6 pb-2 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
            <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-cyan-400 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-200 group-hover:scale-110"></div>
                        <img 
                            src="/profil.jpeg" 
                            alt="User Profile" 
                            className="relative w-12 h-12 rounded-full object-cover border-2 border-background-light dark:border-background-dark"
                        />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background-light dark:border-background-dark rounded-full"></div>
                    </div>
                    <div>
                        <p className="text-lg uppercase tracking-widest text-text-muted font-bold mb-0.5">{t('role_title')}</p>
                        <h1 className="text-xl font-black leading-none dark:text-white tracking-tight">Victor</h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    {/* Language Toggle Button */}
                    <button 
                        onClick={toggleLanguage}
                        className="h-11 px-4 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-sm font-bold flex items-center gap-1.5 hover:border-primary/50 hover:shadow-md transition-all text-slate-700 dark:text-slate-200 shadow-sm active:scale-95"
                    >
                        <span className={language === 'ro' ? 'text-primary' : 'text-text-muted transition-colors'}>RO</span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className={language === 'de' ? 'text-primary' : 'text-text-muted transition-colors'}>DE</span>
                    </button>
                    
                    <button 
                        onClick={() => navigate('/settings')}
                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-text-muted hover:text-primary hover:border-primary/50 hover:shadow-md transition-all shadow-sm active:scale-95"
                    >
                        <Settings size={22} strokeWidth={1.5} />
                    </button>
                </div>
            </div>
        </header>
    );
};

const BottomNav = () => {
    const { t } = useLanguage();
    
    return (
        <nav className="fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none">
            <div className="max-w-xs mx-auto relative pointer-events-auto">
                {/* Floating Capsule Container */}
                <div className="bg-white/90 dark:bg-card-dark/90 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-1.5 flex items-center justify-between">
                    
                    {/* Left: Home */}
                    <NavLink
                        to="/"
                        className={({ isActive }) => `
                            flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300
                            ${isActive 
                                ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400/30' 
                                : 'text-text-muted hover:text-primary dark:hover:text-white'}
                        `}
                    >
                        <Home size={24} strokeWidth={2.5} />
                    </NavLink>

                    {/* Center: Add Button */}
                    <NavLink
                        to="/new"
                        className={({ isActive }) => `
                            flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300
                            ${isActive 
                                ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400/30' 
                                : 'text-text-muted hover:text-primary dark:hover:text-white'}
                        `}
                    >
                        <Plus size={28} strokeWidth={2.5} />
                    </NavLink>

                    {/* Right: Map */}
                    <NavLink
                        to="/map"
                        className={({ isActive }) => `
                            flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300
                            ${isActive 
                                ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400/30' 
                                : 'text-text-muted hover:text-primary dark:hover:text-white'}
                        `}
                    >
                         <MapIcon size={24} strokeWidth={2.5} />
                    </NavLink>
                </div>
            </div>
        </nav>
    );
};

export default Layout;
