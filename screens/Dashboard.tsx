import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Calendar, Filter } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import { getProjects } from '../services/storage';
import { Project } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard: React.FC = () => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'finished'>('all');

    useEffect(() => {
        const loadProjects = async () => {
            const data = await getProjects();
            setProjects(data);
        };
        loadProjects();
    }, []);

    const toggleSort = () => {
        setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
    };

    const filteredProjects = projects
        .filter(p => {
            const matchesSearch = 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                p.client.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = 
                statusFilter === 'all' ? true :
                statusFilter === 'active' ? (p.status === 'În Lucru' || p.status === 'În Așteptare') :
                statusFilter === 'finished' ? p.status === 'Finalizat' : true;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortOrder === 'newest') {
                return b.createdAt - a.createdAt;
            } else {
                return a.createdAt - b.createdAt;
            }
        });

    return (
        <div className="px-4 pb-10 overflow-x-hidden">
            {/* Search & Utility Bar */}
            <div className="my-6 space-y-4">
                <div className="flex gap-3">
                    <div className="relative group flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                             <Search size={22} />
                        </div>
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-surface-dark border-2 border-transparent focus:border-primary/50 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-text-muted/70 text-base font-medium dark:text-white shadow-sm hover:shadow-md focus:shadow-glow"
                            placeholder={t('search_placeholder')}
                        />
                    </div>
                    <button 
                        onClick={toggleSort}
                        className="bg-white dark:bg-surface-dark border-2 border-transparent text-text-muted hover:text-primary active:scale-95 transition-all w-14 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                        {sortOrder === 'newest' ? <Calendar size={24} /> : <ArrowUpDown size={24} />}
                    </button>
                </div>

                {/* Filters Row */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar items-center pb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-surface-dark text-text-muted shrink-0">
                         <Filter size={14} />
                    </div>
                    
                    <FilterChip 
                        active={statusFilter === 'all'} 
                        label={t('filter_all')}
                        count={projects.length}
                        onClick={() => setStatusFilter('all')} 
                    />
                    <FilterChip 
                        active={statusFilter === 'active'} 
                        label={t('filter_active')}
                        count={projects.filter(p => p.status === 'În Lucru' || p.status === 'În Așteptare').length}
                        onClick={() => setStatusFilter('active')} 
                    />
                    <FilterChip 
                        active={statusFilter === 'finished'} 
                        label={t('filter_finished')} 
                        count={projects.filter(p => p.status === 'Finalizat').length}
                        onClick={() => setStatusFilter('finished')} 
                    />
                </div>
            </div>

            {/* List Header */}
            <div className="flex items-end justify-between mb-5 px-1">
                <h2 className="text-sm font-bold tracking-widest uppercase text-text-muted">
                    {t('list_title')}
                </h2>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                    {filteredProjects.length} {t('results_label')}
                </span>
            </div>

            {/* Project List */}
            <div className="grid gap-6 overflow-x-hidden">
                {filteredProjects.map((project, index) => (
                    <div 
                        key={project.id} 
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <ProjectCard project={project} onDelete={(id) => {
                            setProjects(projects.filter(p => p.id !== id));
                        }} />
                    </div>
                ))}
                
                {filteredProjects.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted border-2 border-dashed border-gray-200 dark:border-white/5 rounded-3xl bg-white/50 dark:bg-surface-dark/30">
                        <Search size={48} className="opacity-20 mb-4" />
                        <p className="font-bold text-lg dark:text-white">{t('no_results')}</p>
                        <p className="text-sm opacity-60">{t('no_results_sub')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper for Filter Chips
const FilterChip = ({ active, label, count, onClick }: { active: boolean, label: string, count: number, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`
            whitespace-nowrap pl-4 pr-2 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2 border-2
            ${active 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25' 
                : 'bg-white dark:bg-surface-dark text-text-muted border-transparent hover:border-primary/20 hover:text-primary dark:text-slate-400'}
        `}
    >
        {label}
        <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-[9px] ${active ? 'bg-white text-primary' : 'bg-gray-100 dark:bg-black/20 text-text-muted'}`}>
            {count}
        </span>
    </button>
);

export default Dashboard;