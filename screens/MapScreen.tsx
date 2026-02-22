import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation } from 'lucide-react';
import { getProjects } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';

// Pulse animation style
const pulseKeyframes = `
    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 0.7;
        }
        50% {
            transform: scale(1.8);
            opacity: 0.3;
        }
        100% {
            transform: scale(2.2);
            opacity: 0;
        }
    }
`;

declare global {
    interface Window {
        L: any;
    }
}

const MapScreen: React.FC = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const navigate = useNavigate();
    const { t } = useLanguage();

    const tRef = useRef(t);
    useEffect(() => { tRef.current = t; }, [t]);

    // Inject pulse animation styles
    useEffect(() => {
        const styleId = 'pulse-animation-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = pulseKeyframes;
            document.head.appendChild(style);
        }
    }, []);

    // Get color based on project status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'În Lucru': return '#3b82f6'; // Blue
            case 'În Așteptare': return '#f59e0b'; // Amber
            case 'Finalizat': return '#10b981'; // Emerald
            default: return '#3b82f6';
        }
    };

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const L = window.L;
        if (!L) return;

        // Center on Germany roughly
        const map = L.map(mapRef.current, { zoomControl: false }).setView([51.1657, 10.4515], 6);
        mapInstance.current = map;

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Dark Matter tiles match the clean dark theme perfectly
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Load projects and add markers
        getProjects().then((projects: any[]) => {
            const bounds = L.latLngBounds([]);

            projects.forEach((p: any) => {
                // Show all projects on map including finalized ones
                if (p.coordinates) {
                const statusColor = getStatusColor(p.status);
                const btnLabel = tRef.current('btn_view_details');
                
                // Combined marker with pin, label and details button
                const combinedIcon = L.divIcon({
                    className: 'custom-marker-container',
                    html: `
                        <div style="display: flex; align-items: center; position: relative;">
                            <div style="
                                position: relative;
                                width: 18px;
                                height: 18px;
                            ">
                                <div style="
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    width: 18px;
                                    height: 18px;
                                    background-color: ${statusColor};
                                    border-radius: 50%;
                                    border: 2.5px solid white;
                                    box-shadow: 0 2px 5px rgba(0,0,0,0.25), inset 0 -2px 4px rgba(0,0,0,0.15);
                                "></div>
                                <div style="
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    width: 18px;
                                    height: 18px;
                                    background-color: ${statusColor};
                                    border-radius: 50%;
                                    animation: pulse 2s ease-out infinite;
                                    opacity: 0.7;
                                "></div>
                            </div>
                            <div style="
                                background-color: white;
                                color: #374151;
                                padding: 3px 10px;
                                border-radius: 6px;
                                font-size: 11px;
                                font-weight: 600;
                                font-family: 'Inter', sans-serif;
                                border: 1px solid #e5e7eb;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                                margin-left: 8px;
                                white-space: nowrap;
                                max-width: 180px;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">${p.name}</div>
                        </div>
                    `,
                    iconSize: [200, 30],
                    iconAnchor: [9, 15]
                });

                // Add combined marker (pin + label)
                const marker = L.marker([p.coordinates.lat, p.coordinates.lng], { icon: combinedIcon })
                    .addTo(map)
                    .on('click', (e) => {
                        // Show info widget for all markers (except those explicitly marked as non-client)
                        if (p.isClient !== false) {
                            const infoWidget = document.getElementById('map-info-widget');
                            if (infoWidget) {
                                // Position widget near the clicked marker
                                const point = map.latLngToContainerPoint(e.latlng);
                                infoWidget.style.left = (point.x + 30) + 'px';
                                infoWidget.style.top = (point.y - 40) + 'px';
                                infoWidget.innerHTML = `
                                    <a href="#/project/${p.id}" style="background: ${statusColor}; color: white; text-decoration: none; border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 700; display: block; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">Vezi detalii →</a>
                                `;
                                infoWidget.style.display = 'block';
                            }
                        }
                    });
                
                bounds.extend([p.coordinates.lat, p.coordinates.lng]);
            }
        });

        if (projects.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
        });

        // Close widget when clicking on map
        map.on('click', () => {
            const infoWidget = document.getElementById('map-info-widget');
            if (infoWidget) {
                infoWidget.style.display = 'none';
            }
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark">
             <nav className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
                <div className="flex items-center justify-between">
                     <button 
                        onClick={() => navigate('/')} 
                        className="pointer-events-auto w-10 h-10 bg-white/90 dark:bg-card-dark/90 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-lg text-slate-900 dark:text-white border border-white/10"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div className="pointer-events-auto px-4 py-2 bg-white/90 dark:bg-card-dark/90 backdrop-blur-xl rounded-xl shadow-lg border border-white/10">
                        <h1 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 dark:text-white">
                            <Navigation size={14} className="text-primary" /> {t('map_title')}
                        </h1>
                    </div>
                </div>
            </nav>

            <div className="flex-1 w-full relative z-0">
                <div ref={mapRef} className="w-full h-full" style={{ background: '#0f172a' }}></div>
                {/* Info Widget that appears on marker click */}
                <div 
                    id="map-info-widget"
                    style={{ display: 'none', position: 'absolute' }}
                    className="z-[1000]"
                ></div>
            </div>
        </div>
    );
};

export default MapScreen;