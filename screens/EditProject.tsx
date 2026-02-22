
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building, MapPin, Activity, Locate, Phone } from 'lucide-react';
import { createNewProject } from '../services/storage';
import { initialSurveyData, ProjectStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const EditProject: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    
    // Simplified state - removed name and customId inputs
    const [formData, setFormData] = useState({
        client: '',
        phone: '',
        address: '',
        status: 'În Lucru' as ProjectStatus,
        stage: 'Inițiere',
        progress: 0
    });

    // State to store detected coordinates
    const [detectedCoords, setDetectedCoords] = useState<{lat: number, lng: number} | null>(null);
    
    const handleGetLocation = () => {
        setIsLocating(true);
        setLocationError(null);
        
        if (!navigator.geolocation) {
            setLocationError('Geolocation nu este suportată de browserul tău');
            setIsLocating(false);
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                console.log('[Location] Detected coordinates:', latitude, longitude);
                
                // Store coordinates for later use
                setDetectedCoords({ lat: latitude, lng: longitude });
                
                // Try reverse geocoding with multiple APIs
                let geocodingSuccess = false;
                
                // Try BigDataCloud (free, works well for reverse geocoding)
                try {
                    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ro`;
                    console.log('[Location] Trying BigDataCloud API...');
                    
                    const bdcResponse = await fetch(bdcUrl);
                    console.log('[Location] BigDataCloud status:', bdcResponse.status);
                    
                    if (bdcResponse.ok) {
                        const bdcData = await bdcResponse.json();
                        console.log('[Location] BigDataCloud data:', bdcData);
                        
                        const parts = [];
                        if (bdcData.locality) parts.push(bdcData.locality);
                        else if (bdcData.city) parts.push(bdcData.city);
                        else if (bdcData.principalSubdivision) parts.push(bdcData.principalSubdivision);
                        
                        if (bdcData.postcode) parts.push(bdcData.postcode);
                        if (bdcData.countryName) parts.push(bdcData.countryName);
                        
                        const addressString = parts.join(', ');
                        console.log('[Location] BigDataCloud address:', addressString);
                        
                        if (addressString) {
                            setFormData(prev => ({ ...prev, address: addressString }));
                            geocodingSuccess = true;
                        }
                    }
                } catch (bdcError) {
                    console.error('[Location] BigDataCloud error:', bdcError);
                }
                
                // If BigDataCloud didn't work, try other APIs
                if (!geocodingSuccess) {
                    try {
                        const targetUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&format=json`;
                        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
                        
                        console.log('[Location] Trying Open-Meteo via proxy...');
                        const response = await fetch(proxyUrl);
                        
                        if (response.ok) {
                            const proxyData = await response.json();
                            
                            if (proxyData.contents) {
                                const data = JSON.parse(proxyData.contents);
                                console.log('[Location] Open-Meteo response:', data);
                                
                                if (data.results && data.results.length > 0) {
                                    const result = data.results[0];
                                    const parts = [];
                                    
                                    if (result.street) parts.push(result.street);
                                    if (result.name) parts.push(result.name);
                                    if (result.city) parts.push(result.city);
                                    if (result.town) parts.push(result.town);
                                    if (result.village) parts.push(result.village);
                                    if (result.postcode) parts.push(result.postcode);
                                    
                                    const addressString = parts.join(', ');
                                    if (addressString) {
                                        setFormData(prev => ({ ...prev, address: addressString }));
                                        geocodingSuccess = true;
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error('[Location] Open-Meteo error:', e);
                    }
                }
                
                // Always set coordinates - either as main address or as fallback
                const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                if (!geocodingSuccess) {
                    console.log('[Location] Using coordinates as address:', coordsString);
                    setFormData(prev => ({ ...prev, address: coordsString }));
                }
                
                setIsLocating(false);
            },
            (error) => {
                let errorMessage = 'Eroare necunoscută';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Permisiunea de localizare a fost refuzată';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Informațiile despre locație nu sunt disponibile';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Cererea de localizare a expirat';
                        break;
                }
                setLocationError(errorMessage);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Geocode address to coordinates using Open-Meteo Geocoding API (no CORS issues)
    const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
        try {
            console.log('[Geocoding] Starting for address:', address);
            
            // Use Open-Meteo Geocoding API with CORS proxy
            const response = await fetch(
                `https://corsproxy.io/?https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(address)}&count=1&language=en&format=json`
            );
            
            if (!response.ok) {
                console.error('[Geocoding] HTTP error:', response.status);
                return null;
            }
            
            const data = await response.json();
            console.log('[Geocoding] Response:', data);
            
            // Open-Meteo returns results in data.results
            const results = data.results || data;
            if (results && results.length > 0) {
                const result = {
                    lat: parseFloat(results[0].latitude),
                    lng: parseFloat(results[0].longitude)
                };
                console.log('[Geocoding] Success:', result);
                return result;
            }
            
            console.warn('[Geocoding] No results for address:', address);
            return null;
        } catch (error) {
            console.error('[Geocoding] Error:', error);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        console.log('[EditProject] Submitting with address:', formData.address);
        
        // Use detected coordinates if available, otherwise geocode
        let coordinates = detectedCoords;
        
        // If no detected coordinates, try to geocode the address
        if (!coordinates && formData.address && formData.address.trim()) {
            const geocoded = await geocodeAddress(formData.address);
            if (geocoded) {
                coordinates = geocoded;
            } else {
                console.warn('[EditProject] Geocoding failed for address');
            }
        } else if (!coordinates) {
            console.warn('[EditProject] No coordinates detected');
        }
        
        console.log('[EditProject] Final coordinates:', coordinates);

        // Auto-generate name from Client name only
        await createNewProject({
            name: formData.client, // Use client name as project name without "Site" suffix
            client: formData.client,
            phone: formData.phone || undefined,
            address: formData.address,
            isClient: true,
            coordinates: coordinates,
            status: formData.status,
            currentStage: formData.stage,
            progress: formData.progress,
            image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c7c?q=80&w=800&auto=format&fit=crop',
            photos: [],
            survey: initialSurveyData,
            logistics: { materials: [], machines: [] },
            documents: [],
            fieldNotes: ''
        });
        
        // Redirect to main page
        navigate('/');
    };

    // Create preview project object
    const previewProject = {
        id: 'preview-' + Date.now(),
        name: formData.client || 'Nume Proiect',
        client: formData.client || 'Client',
        address: formData.address || 'Adresă',
        isClient: true,
        coordinates: { lat: 0, lng: 0 },
        status: formData.status,
        currentStage: formData.stage,
        progress: formData.progress,
        image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c7c?q=80&w=800&auto=format&fit=crop',
        photos: [],
        survey: initialSurveyData,
        logistics: { materials: [], machines: [] },
        documents: [],
        fieldNotes: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    return (
        <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
            <nav className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-4 flex items-center gap-3 border-b border-gray-200 dark:border-white/5">
                <button 
                    onClick={() => navigate('/')} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 hover:border-primary/50 text-text-muted hover:text-primary transition-all shadow-sm active:scale-95"
                >
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                <h1 className="text-lg font-black tracking-tight dark:text-white">{t('new_project_title')}</h1>
            </nav>

            <div className="flex-1 flex overflow-hidden">
                {/* Form Section - Centered */}
                <div className="flex-1 p-6 overflow-y-auto flex justify-center">
                    <div className="w-full max-w-lg">
                    <form id="new-project-form" onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Client Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                            <Building size={12} /> {t('label_client')}
                        </label>
                        <input 
                            required
                            type="text"
                            value={formData.client}
                            onChange={e => setFormData({...formData, client: e.target.value})}
                            className="w-full bg-white dark:bg-card-dark border-2 border-transparent dark:border-white/5 rounded-2xl p-4 text-lg font-bold dark:text-white outline-none focus:border-primary/50 focus:shadow-glow transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                            placeholder="Ex. Siemens AG"
                        />
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                            <Phone size={12} /> Telefon
                        </label>
                        <input 
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-white dark:bg-card-dark border-2 border-transparent dark:border-white/5 rounded-2xl p-4 text-base font-medium dark:text-white outline-none focus:border-primary/50 focus:shadow-glow transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                            placeholder="Ex. +49 30 12345678"
                        />
                    </div>

                    {/* Address Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                             <MapPin size={12} /> {t('label_address')}
                        </label>
                        <div className="relative">
                            <input 
                                required
                                type="text"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className="w-full bg-white dark:bg-card-dark border-2 border-transparent dark:border-white/5 rounded-2xl p-4 text-base font-medium dark:text-white outline-none focus:border-primary/50 focus:shadow-glow transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 pr-14"
                                placeholder="Ex. Berlin-Mitte, DE"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    disabled={isLocating}
                                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                                        isLocating 
                                            ? 'bg-primary/20 text-primary animate-pulse' 
                                            : 'bg-primary/10 text-primary hover:bg-primary/20 active:scale-95'
                                    }`}
                                    title="Detectează locația curentă"
                                >
                                    <Locate size={18} />
                                </button>
                            </span>
                        </div>
                        {locationError && (
                            <p className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                {locationError}
                            </p>
                        )}
                    </div>

                    {/* Status Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                            <Activity size={12} /> {t('label_status')}
                        </label>
                        <div className="relative">
                            <select
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value as ProjectStatus})}
                                className="w-full bg-white dark:bg-card-dark border-2 border-transparent dark:border-white/5 rounded-2xl p-4 text-base font-medium dark:text-white outline-none focus:border-primary/50 focus:shadow-glow appearance-none transition-all cursor-pointer"
                            >
                                <option value="În Lucru">În Lucru</option>
                                <option value="În Așteptare">În Așteptare</option>
                                <option value="Finalizat">Finalizat</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>
                    </div>

                </form>
                </div>
                </div>
            </div>

            {/* Bottom Button - Adjusted for new layout */}
            <div className="p-4 border-t border-gray-200 dark:border-white/5 bg-background-light dark:bg-background-dark">
                <button 
                    type="submit" 
                    form="new-project-form"
                    className="w-full bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 border-t border-blue-400/20 text-white font-black uppercase tracking-wide py-4 rounded-2xl shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.01]"
                >
                    <Save size={20} /> {t('btn_create')}
                </button>
            </div>
        </div>
    );
};

export default EditProject;
