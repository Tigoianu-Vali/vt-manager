import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, ChevronRight, Trash2, X, Phone, Clock } from 'lucide-react';
import { Project } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { deleteProject } from '../services/storage';

interface ProjectCardProps {
    project: Project;
    onDelete?: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
    const { t } = useLanguage();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [swipeX, setSwipeX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);

    // Get gradient based on status
    const getStatusGradient = (status: string) => {
        switch (status) {
            case 'În Lucru': return 'linear-gradient(135deg, #3b82f6 0%, #1e40af 50%, #1e3a8a 100%)';
            case 'În Așteptare': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)';
            case 'Finalizat': return 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)';
            default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    };

    // Generate unique gradient based on project name
    const getUniqueGradient = (name: string) => {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #5b4b8a 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #c44569 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #00c4cc 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #2dd4bf 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 50%, #f59e0b 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #f472b6 100%)',
            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fda4af 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #f97316 100%)',
            'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)',
            'linear-gradient(135deg, #c3cfe2 0%, #a8c0ff 50%, #7f7fd5 100%)',
            'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 50%, #64b5f6 100%)',
            'linear-gradient(135deg, #f6d365 0%, #fda085 50%, #f97316 100%)',
        ];
        const index = name ? name.charCodeAt(0) % gradients.length : 0;
        return gradients[index];
    };

    const handleDelete = async () => {
        await deleteProject(project.id);
        setShowDeleteConfirm(false);
        if (onDelete) {
            onDelete(project.id);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'În Lucru': return 'bg-blue-600 text-white border-blue-500';
            case 'În Așteptare': return 'bg-amber-500 text-white border-amber-400';
            default: return 'bg-emerald-600 text-white border-emerald-500';
        }
    };

    const getTranslatedStatus = (status: string) => {
        switch (status) {
            case 'În Lucru': return t('status_in_progress');
            case 'În Așteptare': return t('status_on_hold');
            case 'Finalizat': return t('status_finished');
            default: return status;
        }
    };

    // Format date for display
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Acum';
        if (diffMins < 60) return `Acum ${diffMins}m`;
        if (diffHours < 24) return `Acum ${diffHours}h`;
        if (diffDays === 1) return 'Ieri';
        if (diffDays < 7) return `Acum ${diffDays}z`;
        return date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' });
    };

    // Get client initial for avatar
    const getClientInitial = () => {
        if (project.client && project.client.length > 0) {
            return project.client.charAt(0).toUpperCase();
        }
        return '?';
    };

    // Get avatar gradient based on client name
    const getAvatarGradient = () => {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        ];
        const index = project.client ? project.client.charCodeAt(0) % gradients.length : 0;
        return gradients[index];
    };

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        startXRef.current = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging) return;
        const currentX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const diff = currentX - startXRef.current;
        if (diff < 0) {
            setSwipeX(Math.max(diff, -180));
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (swipeX < -100) {
            setShowDeleteConfirm(true);
        }
        setSwipeX(0);
    };

    return (
        <>
            <div className="relative overflow-hidden rounded-2xl">
                {/* Swipe to delete background */}
                <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl" style={{ background: getStatusGradient(project.status) }} />
                <div 
                    className="absolute right-0 top-0 bottom-0 w-28 bg-red-500 flex items-center justify-center" 
                    style={{ opacity: Math.min(Math.abs(swipeX) / 80, 1), transition: isDragging ? 'none' : 'opacity 0.3s ease' }}
                >
                    <Trash2 size={28} className="text-white" />
                </div>
                
                {/* Main card */}
                <div 
                    className="bg-white dark:bg-card-dark rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-800 touch-none" 
                    style={{ transform: `translateX(${swipeX}px)`, transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                    onTouchStart={handleTouchStart} 
                    onTouchMove={handleTouchMove} 
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleTouchStart} 
                    onMouseMove={handleTouchMove} 
                    onMouseUp={handleTouchEnd} 
                    onMouseLeave={handleTouchEnd}
                >
                    <Link to={`/project/${project.id}`} className="block group">
                        {/* Hero Section with Image/Map */}
                        <div className="relative h-40 w-full overflow-hidden">
                            {/* Blurred map background */}
                            {project.coordinates && (
                                <div 
                                    className="absolute inset-0 opacity-40"
                                    style={{
                                        background: `
                                            radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
                                            radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
                                            linear-gradient(135deg, rgba(100, 100, 100, 0.5) 0%, rgba(50, 50, 50, 0.4) 100%)
                                        `
                                    }}
                                />
                            )}
                            
                            {/* Background Image or Gradient */}
                            <div 
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                                style={{ 
                                    backgroundImage: project.image 
                                        ? `url('${project.image}')` 
                                        : getStatusGradient(project.status)
                                }} 
                            />
                            {!project.image && <div className="absolute inset-0" style={{ background: getStatusGradient(project.status) }} />}
                            
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                            
                            {/* Status Badge */}
                            <div className="absolute top-3 left-3">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(project.status)} shadow-lg backdrop-blur-sm`}>
                                    {getTranslatedStatus(project.status)}
                                </span>
                            </div>

                            {/* Client Avatar - Professional Circle */}
                            <div className="absolute top-3 right-3">
                                <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-xl border-2 border-white/30"
                                    style={{ background: getAvatarGradient() }}
                                >
                                    {getClientInitial()}
                                </div>
                            </div>

                            {/* Project Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="text-xl font-black text-white leading-tight drop-shadow-lg tracking-tight mb-1 truncate">
                                    {project.name}
                                </h3>
                                {/* Address */}
                                <div className="flex items-center gap-1.5 text-gray-300">
                                    <MapPin size={12} className="text-primary shrink-0" />
                                    <p className="text-xs font-medium truncate">{project.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Info Bar - Date only */}
                        <div className="p-3 bg-gray-50 dark:bg-card-dark/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end">
                            {/* Date */}
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Clock size={12} />
                                <span className="text-xs font-medium">
                                    {formatDate(project.updatedAt)}
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
                    <div className="relative bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-black dark:text-white mb-2">Șterge Proiectul?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Ești sigur că vrei să ștergi proiectul <strong className="text-gray-900 dark:text-white">"{project.name}"</strong>? Această acțiune nu poate fi anulată.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)} 
                                    className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Anulează
                                </button>
                                <button 
                                    onClick={handleDelete} 
                                    className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25"
                                >
                                    Șterge
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProjectCard;
