
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Package, Truck, Save, Search, Edit2, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getCatalog, saveCatalog } from '../services/storage';
import { CatalogData, CatalogItem } from '../types';

const SettingsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'materials' | 'machines'>('materials');
    const [catalog, setCatalog] = useState<CatalogData>({ materials: [], machines: [] });
    
    // Add Item Inputs
    const [newItemName, setNewItemName] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('');
    
    // Edit State
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editUnit, setEditUnit] = useState('');
    
    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadCatalog = async () => {
            const data = await getCatalog();
            setCatalog(data);
        };
        loadCatalog();
    }, []);

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;

        const newItem: CatalogItem = {
            id: Date.now().toString(),
            name: newItemName,
            unit: activeTab === 'materials' ? (newItemUnit || 'buc') : undefined
        };

        const updatedCatalog = { ...catalog };
        if (activeTab === 'materials') {
            updatedCatalog.materials = [newItem, ...updatedCatalog.materials];
        } else {
            updatedCatalog.machines = [newItem, ...updatedCatalog.machines];
        }

        setCatalog(updatedCatalog);
        await saveCatalog(updatedCatalog);
        setNewItemName('');
        setNewItemUnit('');
        setSearchTerm(''); // Clear search on add to see the new item
    };

    const handleDeleteItem = async (id: string) => {
        const updatedCatalog = { ...catalog };
        if (activeTab === 'materials') {
            updatedCatalog.materials = updatedCatalog.materials.filter(item => item.id !== id);
        } else {
            updatedCatalog.machines = updatedCatalog.machines.filter(item => item.id !== id);
        }
        setCatalog(updatedCatalog);
        await saveCatalog(updatedCatalog);
    };
    
    const startEdit = (item: CatalogItem) => {
        setEditingItem(item);
        setEditName(item.name);
        setEditUnit(item.unit || '');
    };
    
    const saveEdit = async () => {
        if (!editingItem || !editName.trim()) return;
        const updatedCatalog = { ...catalog };
        if (activeTab === 'materials') {
            updatedCatalog.materials = updatedCatalog.materials.map(item => 
                item.id === editingItem.id ? { ...item, name: editName, unit: editUnit || 'buc' } : item
            );
        } else {
            updatedCatalog.machines = updatedCatalog.machines.map(item => 
                item.id === editingItem.id ? { ...item, name: editName } : item
            );
        }
        setCatalog(updatedCatalog);
        await saveCatalog(updatedCatalog);
        setEditingItem(null);
    };

    // Filter Items Logic
    const currentList = activeTab === 'materials' ? catalog.materials : catalog.machines;
    const filteredList = currentList.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
                <button 
                    onClick={() => navigate('/')} 
                    className="w-10 h-10 bg-white dark:bg-card-dark rounded-xl flex items-center justify-center shadow-lg border border-gray-200 dark:border-gray-800"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-white" />
                </button>
                <h1 className="text-xl font-black dark:text-white">{t('settings_title')}</h1>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-2 p-4">
                <button
                    onClick={() => setActiveTab('materials')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                        activeTab === 'materials' 
                            ? 'bg-primary text-white' 
                            : 'bg-white dark:bg-card-dark text-slate-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
                    }`}
                >
                    <Package size={18} className="inline mr-2" />
                    {t('tab_catalog_materials')}
                </button>
                <button
                    onClick={() => setActiveTab('machines')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                        activeTab === 'machines' 
                            ? 'bg-primary text-white' 
                            : 'bg-white dark:bg-card-dark text-slate-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
                    }`}
                >
                    <Truck size={18} className="inline mr-2" />
                    {t('tab_catalog_machines')}
                </button>
            </div>

            {/* Add Item Form */}
            <div className="px-4 pb-2">
                <div className="bg-white dark:bg-card-dark rounded-2xl p-4 border-2 border-transparent dark:border-white/5">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300 mb-1.5">Nume</label>
                            <input
                                type="text"
                                placeholder={activeTab === 'materials' ? 'Nume material...' : 'Nume utilaj...'}
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                                className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl p-3 dark:text-white"
                            />
                        </div>
                        {activeTab === 'materials' && (
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300 mb-1.5">Unitate</label>
                                <input
                                    type="text"
                                    placeholder="Ex: buc, kg, mc"
                                    value={newItemUnit}
                                    onChange={e => setNewItemUnit(e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl p-3 dark:text-white"
                                />
                            </div>
                        )}
                        <button
                            onClick={handleAddItem}
                            className="w-full py-3 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all font-medium"
                        >
                            <Plus size={20} className="mr-2" /> Adaugă
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 pb-4">
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Caută..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-card-dark border-2 border-transparent dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-base font-medium dark:text-white outline-none focus:border-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="space-y-3">
                    {filteredList.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-800 rounded-2xl group hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-3">
                                {/* Dynamic Icon Background Color */}
                                <div className={`p-2.5 rounded-xl ${
                                    activeTab === 'materials' 
                                        ? 'bg-blue-500/10 text-primary' 
                                        : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                    {activeTab === 'materials' ? <Package size={20} /> : <Truck size={20} />}
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{item.name}</p>
                                    {/* Show unit if exists (Materials), otherwise maintain spacing consistency or show type */}
                                    {activeTab === 'materials' ? (
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">{item.unit}</p>
                                    ) : (
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">{t('tab_catalog_machines')}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => startEdit(item)} 
                                    className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteItem(item.id)} 
                                    className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {filteredList.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-gray-50/50 dark:bg-white/5">
                           <Search size={32} className="opacity-20 mb-3" />
                           <p className="text-sm font-medium">
                               {searchTerm ? 'Nu am găsit rezultate.' : 'Lista este goală.'}
                           </p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-card-dark rounded-3xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold dark:text-white mb-6">Editează</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300 mb-2">Nume</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl p-4 dark:text-white text-lg"
                                    autoFocus
                                />
                            </div>
                            {activeTab === 'materials' && (
                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-300 mb-2">Unitate</label>
                                    <input
                                        type="text"
                                        value={editUnit}
                                        onChange={e => setEditUnit(e.target.value)}
                                        placeholder="Ex: buc, kg, mc"
                                        className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl p-4 dark:text-white text-lg"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button 
                                onClick={() => setEditingItem(null)} 
                                className="flex-1 py-4 rounded-xl bg-gray-200 dark:bg-gray-700 font-medium dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Anulează
                            </button>
                            <button 
                                onClick={saveEdit} 
                                className="flex-1 py-4 rounded-xl bg-primary text-white font-medium hover:opacity-90"
                            >
                                Salvează
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsScreen;
