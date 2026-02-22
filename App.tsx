
import React, { Suspense, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import { LanguageProvider } from './contexts/LanguageContext';

// Lazy loading pentru toate ecranele
const Dashboard = React.lazy(() => import('./screens/Dashboard'));
const ProjectDetails = React.lazy(() => import('./screens/ProjectDetails'));
const EditProject = React.lazy(() => import('./screens/EditProject'));
const MapScreen = React.lazy(() => import('./screens/MapScreen'));
const SettingsScreen = React.lazy(() => import('./screens/SettingsScreen'));

// Componenta Logo V.T. Manager - Stilizat Profesional
const Logo: React.FC = () => (
    <div className="text-center">
        {/* Logo stilizat cu efecte */}
        <div className="relative inline-block mb-4">
            {/* Glow background */}
            <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full transform scale-150" />
            
            {/* Main text */}
            <h1 className="relative text-6xl font-black leading-none tracking-wider" style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 40%, #1d4ed8 60%, #93c5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))',
            }}>
                V. T.
            </h1>
        </div>
        
        {/* Manager text */}
        <p className="text-2xl font-bold uppercase tracking-[0.3em] text-slate-300" style={{
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}>
            Manager
        </p>
        
        {/* Subtitle */}
        <p className="text-sm text-slate-500 font-medium mt-2 tracking-wide">Gestionare Clienți</p>
    </div>
);

// Componenta Loading Screen (Splash Screen)
const LoadingScreen: React.FC = () => {
    const [progress, setProgress] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const duration = 2000;
        const interval = 20;
        const increment = 100 / (duration / interval);
        
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return Math.min(prev + increment, 100);
            });
        }, interval);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (progress >= 100) {
            const fadeTimer = setTimeout(() => {
                setFadeOut(true);
            }, 300);
            return () => clearTimeout(fadeTimer);
        }
    }, [progress]);

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background-dark transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {/* Decorative background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                     linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }} />
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-800/10 rounded-full blur-3xl" />
            </div>
            
            {/* Content */}
            <div className="relative z-10">
                <Logo />
            </div>

            {/* Progress Bar */}
            <div className="mt-16 w-72 h-1.5 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                    className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full relative"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg shadow-blue-400 ring-2 ring-blue-500/50" />
                </div>
            </div>

            {/* Loading text */}
            <p className="text-slate-400 text-sm mt-6 font-medium tracking-[0.2em] uppercase">
                {progress < 30 ? 'Se încarcă...' : 
                 progress < 60 ? 'Se pregătesc datele...' : 
                 progress < 90 ? 'Aproape gata...' : 
                 'Bine ai venit!'}
            </p>

            {/* Animated dots */}
            <div className="flex gap-2 mt-6">
                {[0, 1, 2, 3].map((i: number) => (
                    <div 
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ 
                            background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                            animation: 'pulse 1s infinite',
                            animationDelay: `${i * 0.15}s`
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { 
                        transform: scale(1); 
                        opacity: 0.4; 
                    }
                    50% { 
                        transform: scale(1.3); 
                        opacity: 1; 
                    }
                }
            `}</style>
        </div>
    );
};

// Componenta de încărcare pentru Suspense
const ScreenLoader: React.FC = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-text-muted text-sm">Se încarcă...</p>
        </div>
    </div>
);

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2300);

        return () => clearTimeout(timer);
    }, []);

    return (
        <LanguageProvider>
            <LoadingScreen />
            
            <HashRouter>
                <Routes>
                    <Route element={
                        <Layout>
                            <Outlet />
                        </Layout>
                    }>
                        <Route path="/" element={
                            <Suspense fallback={<ScreenLoader />}>
                                <Dashboard />
                            </Suspense>
                        } />
                    </Route>

                    <Route path="/map" element={
                        <Suspense fallback={<ScreenLoader />}>
                            <MapScreen />
                        </Suspense>
                    } />
                    <Route path="/project/:id" element={
                        <Suspense fallback={<ScreenLoader />}>
                            <ProjectDetails />
                        </Suspense>
                    } />
                    <Route path="/new" element={
                        <Suspense fallback={<ScreenLoader />}>
                            <EditProject />
                        </Suspense>
                    } />
                    <Route path="/settings" element={
                        <Suspense fallback={<ScreenLoader />}>
                            <SettingsScreen />
                        </Suspense>
                    } />
                </Routes>
            </HashRouter>
        </LanguageProvider>
    );
};

export default App;
