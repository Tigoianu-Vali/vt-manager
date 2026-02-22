import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageSquare, Save, Ruler, Truck, Mountain, Activity, CheckSquare, Plus, Image as ImageIcon, ChevronRight, FileText, Camera, User, MapPin, TrendingUp, Layers, Trash2, Edit2, X, Check, Package, Search, MoveRight, Trees, Sprout, Wind, Navigation, Map as MapIcon, Share2, ChevronDown, CloudRain, Sun, Droplets, Thermometer, Printer, FileCode, DownloadCloud, FileDigit, Info, FolderOpen, ClipboardList, GripHorizontal, Feather, Briefcase, ChevronLeft, Leaf, Gauge, Cloud, CloudSun, CloudLightning, Snowflake, CloudFog, CloudDrizzle, Moon, Sunrise } from 'lucide-react';
import { Project, SurveyData, MaterialItem, MachineItem, CatalogData, ProjectStatus, DocumentItem } from '../types';
import { getProjectById, saveProject, getCatalog, deleteProject } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';
import { uploadImage, listBuckets } from '../services/supabase';

// Utility function to remove Romanian diacritics
const removeDiacritics = (text: string): string => {
    if (!text) return '';
    const diacriticsMap: Record<string, string> = {
        'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
        'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T'
    };
    return text.replace(/[ăâîșțĂÂÎȘȚ]/g, (char) => diacriticsMap[char] || char);
};

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [project, setProject] = useState<Project | null>(null);
    
    // Performance diagnostic: track ProjectDetails mounts
    useEffect(() => {
        console.log('[ProjectDetails] Mounted | ID:', id);
        // Debug: Check buckets
        listBuckets();
    }, [id]);
    
    const [activeTab, setActiveTab] = useState<'survey' | 'logistics' | 'gallery' | 'notes'>('survey');
    const [isSaving, setIsSaving] = useState(false);
    
    // Status Menu State
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    
    // Catalog State
    const [catalog, setCatalog] = useState<CatalogData>({ materials: [], machines: [] });

    // Client Info Edit State
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState(project?.phone || '');
    
    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Logistics Management State
    const [isAddingMaterial, setIsAddingMaterial] = useState(false);
    const [isCustomMaterial, setIsCustomMaterial] = useState(false); 
    const [materialSearch, setMaterialSearch] = useState('');
    const [showMaterialSuggestions, setShowMaterialSuggestions] = useState(false);
    const [machineSearch, setMachineSearch] = useState('');
    const [showMachineSuggestions, setShowMachineSuggestions] = useState(false); 
    const [newMaterial, setNewMaterial] = useState<Partial<MaterialItem>>({ name: '', quantity: 0, unit: '' });
    
    const [isAddingMachine, setIsAddingMachine] = useState(false);
    const [newMachine, setNewMachine] = useState<Partial<MachineItem>>({ name: '', status: 'Activ' });

    // Weather State
    const [weather, setWeather] = useState<{
        temperature: number;
        feelsLike: number;
        description: string;
        windSpeed: number;
        humidity: number;
        precipitation: number;
        pressure: number;
        cloudCover: number;
        uvIndex: number;
        icon: string;
    } | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);

    // Gallery State
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
    const [generatingPDF, setGeneratingPDF] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (id) {
                const data = await getProjectById(id);
                if (data) {
                    setProject(data);
                    // Update phone number when project is loaded
                    setPhoneNumber(data.phone || '');
                } else {
                    navigate('/');
                }
            }
            // Load Catalog
            const catalogData = await getCatalog();
            setCatalog(catalogData);
        };
        loadData();
    }, [id, navigate]);

    // Close suggestion lists when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Close material suggestions
            if (showMaterialSuggestions && !target.closest('#material-search-container')) {
                setShowMaterialSuggestions(false);
            }
            // Close machine suggestions
            if (showMachineSuggestions && !target.closest('#machine-search-container')) {
                setShowMachineSuggestions(false);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showMaterialSuggestions, showMachineSuggestions]);

    // Fetch weather based on project coordinates
    useEffect(() => {
        if (!project?.coordinates) {
            setWeather(null);
            return;
        }
        
        const fetchWeather = async () => {
            setWeatherLoading(true);
            try {
                const { lat, lng } = project.coordinates;
                
                // Check if coordinates are valid (not Berlin defaults)
                if (lat === 52.52 && lng === 13.40) {
                    console.log('[Weather] Invalid coordinates (Berlin default), skipping weather fetch');
                    setWeather(null);
                    setWeatherLoading(false);
                    return;
                }
                
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,apparent_temperature,pressure_msl,cloud_cover,uv_index`
                );
                
                if (!response.ok) throw new Error('Weather fetch failed');
                
                const data = await response.json();
                const current = data.current;
                
                // Map weather code to description and icon
                const weatherCode = current.weather_code;
                let description = 'Senin';
                let icon = 'sun';
                
                if (weatherCode === 0) { description = 'Senin'; icon = 'sun'; }
                else if (weatherCode === 1) { description = 'Parțial Senin'; icon = 'sun'; }
                else if (weatherCode === 2) { description = 'Parțial Înnorat'; icon = 'partlyCloudy'; }
                else if (weatherCode === 3) { description = 'Înnorat'; icon = 'cloud'; }
                else if (weatherCode === 45 || weatherCode === 48) { description = 'Cețos'; icon = 'fog'; }
                else if (weatherCode >= 51 && weatherCode <= 55) { description = 'Bruină'; icon = 'drizzle'; }
                else if (weatherCode >= 56 && weatherCode <= 57) { description = 'Ploaie înghețată'; icon = 'drizzle'; }
                else if (weatherCode >= 61 && weatherCode <= 65) { description = 'Ploaie'; icon = 'rain'; }
                else if (weatherCode >= 66 && weatherCode <= 67) { description = 'Ploaie înghețată'; icon = 'rain'; }
                else if (weatherCode >= 71 && weatherCode <= 77) { description = 'Ninge'; icon = 'snow'; }
                else if (weatherCode >= 80 && weatherCode <= 82) { description = 'Ploaie'; icon = 'rain'; }
                else if (weatherCode >= 85 && weatherCode <= 86) { description = 'Ninge'; icon = 'snow'; }
                else if (weatherCode >= 95) { description = 'Furtună'; icon = 'storm'; }
                else { description = 'Înnorat'; icon = 'cloud'; }
                
                setWeather({
                    temperature: Math.round(current.temperature_2m),
                    feelsLike: Math.round(current.apparent_temperature),
                    description,
                    windSpeed: Math.round(current.wind_speed_10m),
                    humidity: current.relative_humidity_2m,
                    precipitation: Math.round(current.precipitation),
                    pressure: Math.round(current.pressure_msl),
                    cloudCover: current.cloud_cover,
                    uvIndex: current.uv_index,
                    icon
                });
            } catch (error) {
                console.error('Weather fetch error:', error);
            } finally {
                setWeatherLoading(false);
            }
        };
        
        fetchWeather();
    }, [project?.coordinates]);

    const handleSave = async () => {
        if (project) {
            // Sync phone number to project before saving
            const projectToSave = {
                ...project,
                phone: phoneNumber || undefined
            };
            await saveProject(projectToSave);
            // Show centered success widget
            setShowSaveSuccess(true);
            setTimeout(() => {
                setShowSaveSuccess(false);
                navigate('/');
            }, 1500);
        }
    };

    const handleDelete = async () => {
        if (project) {
            await deleteProject(project.id);
            setShowDeleteConfirm(false);
            navigate('/');
        }
    };

    const handleExport = async () => {
        if (!project) return;
        
        setGeneratingPDF(true);
        
        try {
            const { jsPDF } = await import('jspdf');
            
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Labels based on current language
            const labels = language === 'de' ? {
                appTitle: 'V.T. MANAGER',
                reportTitle: 'PROJEKTBERICHT',
                clientInfo: 'KUNDENINFORMATIONEN',
                projectDetails: 'PROJEKTDETAILS',
                surveyData: 'ANALYSEDATEN',
                logistics: 'LOGISTIK',
                documents: 'DOKUMENTE',
                fieldNotes: 'FELDNOTIZEN',
                client: 'Kunde',
                clientName: 'Name',
                address: 'Adresse',
                phone: 'Telefon',
                email: 'E-Mail',
                status: 'Status',
                statusLabel: 'Status',
                area: 'Fläche',
                perimeter: 'Umfang',
                length: 'Länge',
                width: 'Breite',
                slope: 'Neigung',
                topography: 'Topographie',
                soilType: 'Bodenart',
                materials: 'MATERIALIEN',
                machines: 'GERÄTE / WERKZEUGE',
                generated: 'Erstellt',
                generatedOn: 'Report erstellt am',
                page: 'Seite',
                of: 'von',
            } : {
                appTitle: 'V.T. MANAGER',
                reportTitle: 'RAPORT PROIECT',
                clientInfo: 'INFORMAȚII CLIENT',
                projectDetails: 'DETALII PROIECT',
                surveyData: 'DATE ANALIZĂ',
                logistics: 'LOGISTICĂ',
                documents: 'DOCUMENTE',
                fieldNotes: 'NOTE DE TEREN',
                client: 'Client',
                clientName: 'Nume',
                address: 'Adresă',
                phone: 'Telefon',
                email: 'Email',
                status: 'Status',
                area: 'Suprafață',
                perimeter: 'Perimetru',
                length: 'Lungime',
                width: 'Lățime',
                slope: 'Pantă',
                topography: 'Topografie',
                soilType: 'Tip Sol',
                materials: 'MATERIALE',
                machines: 'UTILATE / SCULE',
                generated: 'Generat',
                generatedOn: 'Raport generat în data de',
                page: 'Pagină',
                of: 'din',
            };
            
            // Colors
            const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
            const accentColor: [number, number, number] = [37, 99, 235]; // Blue 600
            const textColor: [number, number, number] = [51, 65, 85]; // Slate 700
            const mutedColor: [number, number, number] = [100, 116, 139]; // Slate 400
            const lightGray: [number, number, number] = [248, 250, 252]; // Slate 50
            const white: [number, number, number] = [255, 255, 255];
            
            const cleanText = (text: string | undefined): string => {
                return removeDiacritics(text || '-');
            };
            
            // Translate soil type for PDF
            const translateSoilType = (type: string | undefined): string => {
                if (!type) return '-';
                const translations: Record<string, string> = {
                    'Clay': 'Argilos',
                    'Sandy': 'Nisipos',
                    'Stâncos': 'Stancos',
                    'Stancos': 'Stancos'
                };
                return cleanText(translations[type] || type);
            };
            
            // Header with gradient effect
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 45, 'F');
            
            // Accent line
            doc.setFillColor(...accentColor);
            doc.rect(0, 45, 210, 3, 'F');
            
            // Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text(labels.appTitle, 15, 20);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(labels.reportTitle, 15, 30);
            
            // Project info badge
            doc.setFillColor(255, 255, 255, 0.15);
            doc.roundedRect(140, 12, 55, 20, 3, 3, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(cleanText(project.name || 'Proiect'), 145, 18);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(labels.statusLabel + ': ' + cleanText(project.status), 145, 26);
            
            let y = 58;
            
            // Helper function for section headers
            const addSectionHeader = (title: string) => {
                doc.setFillColor(...primaryColor);
                doc.roundedRect(15, y - 4, 180, 8, 2, 2, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(title, 18, y + 1);
                y += 14;
            };
            
            // Helper function for info rows
            const addInfoRow = (label: string, value: string, indent = 0) => {
                doc.setTextColor(...mutedColor);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(label + ':', 20 + indent, y);
                doc.setTextColor(...textColor);
                doc.setFont('helvetica', 'bold');
                doc.text(value, 60 + indent, y);
                y += 7;
            };
            
            // === CLIENT INFO SECTION ===
            addSectionHeader(labels.clientInfo);
            
            doc.setFillColor(...lightGray);
            doc.roundedRect(15, y - 5, 180, 35, 2, 2, 'F');
            
            addInfoRow(labels.client, cleanText(project.client));
            addInfoRow(labels.address, cleanText(project.address));
            addInfoRow(labels.phone, phoneNumber || '-');
            
            y += 10;
            
            // === SURVEY DATA SECTION ===
            if (project.survey) {
                addSectionHeader(labels.surveyData);
                
                doc.setFillColor(...lightGray);
                const surveyRows = [
                    project.survey.area ? `${labels.area}: ${project.survey.area} MP` : null,
                    project.survey.perimeter ? `${labels.perimeter}: ${project.survey.perimeter} m` : null,
                    project.survey.length ? `${labels.length}: ${project.survey.length} m` : null,
                    project.survey.width ? `${labels.width}: ${project.survey.width} m` : null,
                    project.survey.slope ? `${labels.slope}: ${project.survey.slope}%` : null,
                ].filter(Boolean);
                
                if (surveyRows.length > 0) {
                    doc.roundedRect(15, y - 5, 180, surveyRows.length * 7 + 4, 2, 2, 'F');
                    surveyRows.forEach((row) => {
                        if (row) {
                            doc.setTextColor(...textColor);
                            doc.setFontSize(9);
                            doc.setFont('helvetica', 'bold');
                            doc.text(row, 20, y);
                            y += 7;
                        }
                    });
                    y += 5;
                }
                
                // Topography & Soil
                const terrainRows = [
                    project.survey.topography ? `${labels.topography}: ${cleanText(project.survey.topography)}` : null,
                    project.survey.soilType ? `${labels.soilType}: ${translateSoilType(project.survey.soilType)}` : null,
                ].filter(Boolean);
                
                if (terrainRows.length > 0) {
                    doc.setFillColor(...white);
                    doc.roundedRect(15, y - 5, 180, terrainRows.length * 7 + 4, 2, 2, 'F');
                    terrainRows.forEach((row) => {
                        if (row) {
                            doc.setTextColor(...textColor);
                            doc.setFontSize(9);
                            doc.setFont('helvetica', 'bold');
                            doc.text(row, 20, y);
                            y += 7;
                        }
                    });
                    y += 5;
                }
            }
            
            // === LOGISTICS SECTION ===
            if (project.logistics && (project.logistics.materials?.length > 0 || project.logistics.machines?.length > 0)) {
                addSectionHeader(labels.logistics);
                
                // Materials
                if (project.logistics.materials?.length > 0) {
                    doc.setTextColor(...accentColor);
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.text(labels.materials, 20, y);
                    y += 6;
                    
                    doc.setFillColor(...lightGray);
                    doc.roundedRect(15, y - 4, 180, project.logistics.materials.length * 7 + 4, 2, 2, 'F');
                    
                    project.logistics.materials.forEach((mat) => {
                        doc.setTextColor(...textColor);
                        doc.setFontSize(9);
                        doc.setFont('helvetica', 'normal');
                        doc.text('• ' + cleanText(mat.name), 20, y);
                        doc.setFont('helvetica', 'bold');
                        doc.text(`${mat.quantity} ${mat.unit}`, 175, y, { align: 'right' });
                        y += 7;
                    });
                    y += 5;
                }
                
                // Machines
                if (project.logistics.machines?.length > 0) {
                    doc.setTextColor(...accentColor);
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.text(labels.machines, 20, y);
                    y += 6;
                    
                    doc.setFillColor(...lightGray);
                    doc.roundedRect(15, y - 4, 180, project.logistics.machines.length * 7 + 4, 2, 2, 'F');
                    
                    project.logistics.machines.forEach((machine) => {
                        doc.setTextColor(...textColor);
                        doc.setFontSize(9);
                        doc.setFont('helvetica', 'normal');
                        doc.text('• ' + cleanText(machine.name), 20, y);
                        y += 7;
                    });
                    y += 5;
                }
            }
            
            // === FIELD NOTES SECTION ===
            if (project.fieldNotes) {
                addSectionHeader(labels.fieldNotes);
                
                const splitNotes = doc.splitTextToSize(cleanText(project.fieldNotes), 170);
                const notesHeight = splitNotes.length * 5 + 6;
                
                doc.setFillColor(...lightGray);
                doc.roundedRect(15, y - 4, 180, notesHeight, 2, 2, 'F');
                
                doc.setTextColor(...textColor);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(splitNotes, 20, y + 2);
                y += notesHeight + 5;
            }
            
            // === DOCUMENTS SECTION ===
            if (project.documents && project.documents.length > 0) {
                addSectionHeader(labels.documents);
                
                doc.setFillColor(...lightGray);
                doc.roundedRect(15, y - 4, 180, project.documents.length * 7 + 4, 2, 2, 'F');
                
                project.documents.forEach((docItem) => {
                    doc.setTextColor(...textColor);
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.text('• ' + cleanText(docItem.name), 20, y);
                    doc.setTextColor(...mutedColor);
                    doc.setFontSize(8);
                    doc.text(docItem.type.toUpperCase(), 175, y, { align: 'right' });
                    y += 7;
                });
                y += 5;
            }
            
            // Footer
            const pageCount = doc.getNumberOfPages();
            const today = new Date().toLocaleDateString('ro-RO');
            
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                // Footer background
                doc.setFillColor(...primaryColor);
                doc.rect(0, 285, 210, 12, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(
                    `V.T. Manager | ${labels.generatedOn} ${today} | ${labels.page} ${i} ${labels.of} ${pageCount}`,
                    105,
                    292,
                    { align: 'center' }
                );
            }
            
            const fileName = (project.name || 'proiect').toLowerCase().replace(/[^a-z0-9]/g, '_');
            doc.save(fileName + '_raport.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setGeneratingPDF(false);
        }
    };

    const updateSurvey = (key: keyof SurveyData, value: any) => {
        if (!project) return;
        setProject({
            ...project,
            survey: { ...project.survey, [key]: value }
        });
    };

    const updateVegetation = (key: keyof SurveyData['vegetation']) => {
        if (!project) return;
        setProject({
            ...project,
            survey: {
                ...project.survey,
                vegetation: {
                    ...project.survey.vegetation,
                    [key]: !project.survey.vegetation[key]
                }
            }
        });
    }

    const changeStatus = (newStatus: ProjectStatus) => {
        if (!project) return;
        setProject({ ...project, status: newStatus });
        setIsStatusMenuOpen(false);
    };

    // --- DOCUMENTS FUNCTIONS ---
    const docFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);

    const handleDeleteDocument = (docId: string) => {
        if (!project) return;
        setProject({
            ...project,
            documents: (project.documents || []).filter(d => d.id !== docId)
        });
    };

    const handleUploadDoc = () => {
        docFileInputRef.current?.click();
    };

    const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !project) return;

        setIsUploadingDoc(true);
        try {
            // Upload to Supabase
            const fileUrl = await uploadImage(file, 'documents');
            
            if (fileUrl) {
                const newDoc: DocumentItem = {
                    id: Date.now().toString(),
                    name: file.name,
                    type: file.type.includes('pdf') ? 'pdf' : 'doc',
                    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                    date: new Date().toISOString().split('T')[0],
                    url: fileUrl
                };
                setProject({
                    ...project,
                    documents: [newDoc, ...(project.documents || [])]
                });
            } else {
                alert('Eroare la încărcarea documentului');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Eroare la încărcarea documentului');
        } finally {
            setIsUploadingDoc(false);
            if (docFileInputRef.current) {
                docFileInputRef.current.value = '';
            }
        }
    };

    // --- PHOTOS FUNCTIONS ---
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleAddPhoto = async () => {
        // Trigger file input click
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !project) return;

        setIsUploading(true);
        try {
            // Upload to Supabase
            const imageUrl = await uploadImage(file, 'photos');
            
            console.log('Uploaded URL:', imageUrl);
            
            if (imageUrl) {
                setProject({
                    ...project,
                    photos: [imageUrl, ...(project.photos || [])]
                });
            } else {
                alert('Eroare la încărcarea imaginii');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Eroare la încărcarea imaginii');
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeletePhoto = () => {
        if (selectedPhotoIndex === null || !project) return;
        const newPhotos = [...(project.photos || [])];
        newPhotos.splice(selectedPhotoIndex, 1);
        
        setProject({ ...project, photos: newPhotos });
        
        if (newPhotos.length === 0) {
            setSelectedPhotoIndex(null);
        } else if (selectedPhotoIndex >= newPhotos.length) {
            setSelectedPhotoIndex(newPhotos.length - 1);
        }
    };

    // --- LOGISTICS: MATERIAL FUNCTIONS ---
    const handleAddMaterial = () => {
        console.log('handleAddMaterial called', { project, newMaterial, materialSearch });
        
        // Use materialSearch if newMaterial.name is empty
        const materialName = newMaterial.name || materialSearch;
        if (!project || !project.id || !materialName) {
            console.log('Cannot add material: project or name missing', { hasProject: !!project, hasId: project?.id, name: newMaterial.name, search: materialSearch });
            return;
        }
        const item: MaterialItem = {
            id: Date.now().toString(),
            name: materialName,
            quantity: newMaterial.quantity || 1,
            unit: newMaterial.unit || 'buc'
        };
        const currentLogistics = project.logistics || { materials: [], machines: [] };
        console.log('Adding material:', item, 'to logistics:', currentLogistics);
        setProject({
            ...project,
            logistics: { ...currentLogistics, materials: [item, ...(currentLogistics.materials || [])] }
        });
        
        // Reset form
        setNewMaterial({ name: '', quantity: 0, unit: '' });
        setMaterialSearch('');
        setIsCustomMaterial(false);
        setIsAddingMaterial(false);
    };

    const handleDeleteMaterial = (itemId: string) => {
        if (!project) return;
        setProject({
            ...project,
            logistics: {
                ...project.logistics,
                materials: project.logistics.materials.filter(m => m.id !== itemId)
            }
        });
    };

    // --- LOGISTICS: MACHINE FUNCTIONS ---
    const handleAddMachine = () => {
        // Use machineSearch if newMachine.name is empty
        const machineName = newMachine.name || machineSearch;
        if (!project || !machineName) {
            console.log('Cannot add machine: project or name missing', { project: !!project, name: newMachine.name, search: machineSearch });
            return;
        }
        const item: MachineItem = {
            id: Date.now().toString(),
            name: machineName,
            status: newMachine.status || 'Activ'
        };
        const currentLogistics = project.logistics || { materials: [], machines: [] };
        setProject({
            ...project,
            logistics: { ...currentLogistics, machines: [item, ...(currentLogistics.machines || [])] }
        });
        setNewMachine({ name: '', status: 'Activ' });
        setMachineSearch('');
        setIsAddingMachine(false);
    };

    const handleDeleteMachine = (itemId: string) => {
        if (!project) return;
        setProject({
            ...project,
            logistics: {
                ...project.logistics,
                machines: project.logistics.machines.filter(m => m.id !== itemId)
            }
        });
    };

    // --- UI HELPERS ---
    const getTranslatedStatus = (status: string) => {
        switch (status) {
            case 'În Lucru': return t('status_in_progress');
            case 'În Așteptare': return t('status_on_hold');
            case 'Finalizat': return t('status_finished');
            default: return status;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'În Lucru': return 'text-blue-600 border-blue-500/20 bg-blue-500/10';
            case 'În Așteptare': return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
            case 'Finalizat': return 'text-emerald-600 border-emerald-500/20 bg-emerald-500/10';
            default: return 'text-gray-500 border-gray-500/20 bg-gray-500/10';
        }
    }

    const getSoilLabel = (type: string) => {
        switch(type) {
            case 'Clay': return t('soil_clay');
            case 'Sandy': return t('soil_sandy');
            case 'Stâncos': return t('soil_stancos');
            default: return type;
        }
    };

    const getFileIcon = (type: string) => {
        switch(type) {
            case 'pdf': return <FileText size={24} className="text-red-500" />;
            case 'dwg': return <FileCode size={24} className="text-blue-500" />;
            case 'xls': return <FileDigit size={24} className="text-green-500" />;
            default: return <FileText size={24} className="text-gray-500" />;
        }
    };

    // Filter suggestions based on SEARCH INPUT
    const materialSuggestions = catalog.materials.filter(item => 
        item.name.toLowerCase().includes(materialSearch.toLowerCase())
    );

    const machineSuggestions = catalog.machines.filter(item => 
        item.name.toLowerCase().includes(machineSearch.toLowerCase())
    );

    // Action Handlers
    const openWaze = () => window.open(`https://waze.com/ul?q=${encodeURIComponent(project?.address || '')}`, '_blank');
    const openMaps = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project?.address || '')}`, '_blank');
    const callPhone = () => window.location.href = `tel:${phoneNumber}`;
    
    // GPS Location Handler - Get address from current position
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation nu este suportată de browserul tău');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    // Use OpenStreetMap Nominatim for reverse geocoding
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                        {
                            headers: {
                                'User-Agent': 'BauTrupp Manager/1.0'
                            }
                        }
                    );
                    
                    if (!response.ok) throw new Error('Eroare la geocodare');
                    
                    const data = await response.json();
                    const address = data.address;
                    
                    // Build address string: street + number, city, postal code
                    const parts = [];
                    
                    if (address.road) {
                        parts.push(address.road);
                    }
                    if (address.house_number) {
                        parts[parts.length - 1] += ' ' + address.house_number;
                    }
                    if (address.city || address.town || address.village) {
                        parts.push(address.city || address.town || address.village);
                    }
                    if (address.postcode) {
                        parts.push(address.postcode);
                    }
                    
                    const addressString = parts.join(', ');
                    
                    if (addressString && project) {
                        setProject({
                            ...project,
                            address: addressString,
                            coordinates: {
                                lat: latitude,
                                lng: longitude
                            }
                        });
                    }
                } catch (error) {
                    console.error('Reverse geocoding error:', error);
                    alert('Nu am putut obține adresa din locația ta');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Nu am putut accesa locația ta. Verifică permisiunile.');
            }
        );
    };
    const sendMsg = () => window.location.href = `sms:${phoneNumber}`;

    if (!project) return <div className="p-10 text-center dark:text-white">...</div>;

    return (
        <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark">
            {/* Save Success Widget - Centered */}
            {showSaveSuccess && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-card-dark rounded-2xl p-8 shadow-2xl transform animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">Salvat!</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Proiectul a fost salvat</p>
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowDeleteConfirm(false)}
                    />
                    <div className="relative bg-white dark:bg-card-dark rounded-2xl p-6 shadow-2xl max-w-sm w-full transform animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                                <Trash2 size={28} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-black dark:text-white mb-2">Șterge Proiectul?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Această acțiune nu poate fi anulată. Proiectul va fi șters definitiv.
                            </p>
                            <div className="flex gap-3 w-full">
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

            {/* Sticky Header Block: Contains Nav + Tabs */}
            <div className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
                
                {/* Top Nav */}
                <nav className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/')} 
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-500 hover:text-primary transition-all shadow-sm active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </button>
                        <h1 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">{t('details_title')}</h1>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Export Button */}
                        <button 
                            onClick={handleExport}
                            disabled={generatingPDF}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-primary hover:border-primary/50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            <Printer size={18} strokeWidth={2} />
                        </button>

                        {/* Status Dropdown Trigger */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 transition-all active:scale-95 ${getStatusStyle(project.status)}`}
                            >
                                {getTranslatedStatus(project.status)}
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Status Dropdown Menu */}
                            {isStatusMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-[90]" onClick={() => setIsStatusMenuOpen(false)}></div>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-card-dark rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[100] overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                                        {[
                                            { val: 'În Lucru', label: t('status_in_progress'), color: 'text-blue-600' },
                                            { val: 'În Așteptare', label: t('status_on_hold'), color: 'text-amber-500' },
                                            { val: 'Finalizat', label: t('status_finished'), color: 'text-emerald-600' }
                                        ].map((option) => (
                                            <button
                                                key={option.val}
                                                onClick={() => changeStatus(option.val as ProjectStatus)}
                                                className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between group ${option.color}`}
                                            >
                                                {option.label}
                                                {project.status === option.val && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Segmented Tabs */}
                <div className="px-6 pb-4 pt-1">
                    <div className="p-1 bg-gray-200 dark:bg-surface-dark rounded-xl flex relative overflow-hidden border border-gray-200 dark:border-gray-700">
                        {/* Animated Background Pill */}
                        <div 
                            className="absolute top-1 bottom-1 rounded-lg bg-white dark:bg-card-dark shadow-sm transition-all duration-300 ease-out border border-gray-200 dark:border-gray-600"
                            style={{ 
                                left: activeTab === 'survey' ? '0.25rem' : activeTab === 'logistics' ? '25%' : activeTab === 'gallery' ? '50%' : '75%',
                                width: 'calc(25% - 0.35rem)',
                                transform: activeTab === 'survey' ? 'translateX(0)' : 'translateX(0.125rem)' 
                            }}
                        ></div>

                        <button onClick={() => setActiveTab('survey')} className={`flex-1 relative z-10 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wide text-center transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'survey' ? 'text-primary' : 'text-gray-500'}`}>
                            <Info size={14} className="mb-0.5" />
                            <span className="hidden sm:inline">{t('tab_survey')}</span>
                            <span className="sm:hidden">Info</span>
                        </button>
                        <button onClick={() => setActiveTab('logistics')} className={`flex-1 relative z-10 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wide text-center transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'logistics' ? 'text-primary' : 'text-gray-500'}`}>
                            <Truck size={14} className="mb-0.5" />
                            <span className="hidden sm:inline">{t('tab_logistics')}</span>
                            <span className="sm:hidden">Logistic</span>
                        </button>
                        <button onClick={() => setActiveTab('gallery')} className={`flex-1 relative z-10 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wide text-center transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'gallery' ? 'text-primary' : 'text-gray-500'}`}>
                            <FolderOpen size={14} className="mb-0.5" />
                            <span className="hidden sm:inline">{t('tab_gallery')}</span>
                            <span className="sm:hidden">Media</span>
                        </button>
                        <button onClick={() => setActiveTab('notes')} className={`flex-1 relative z-10 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wide text-center transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'notes' ? 'text-primary' : 'text-gray-500'}`}>
                            <ClipboardList size={14} className="mb-0.5" />
                            <span className="hidden sm:inline">{t('tab_notes')}</span>
                            <span className="sm:hidden">Note</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
                {/* Background Map */}
                {(project.coordinates || project.address) && (
                    <div className="fixed inset-0 -z-10 opacity-20 dark:opacity-10">
                        <img 
                            src={project.coordinates 
                                ? `https://tile.openstreetmap.org/15/${Math.floor((project.coordinates.lat + 90) * 10)}/${Math.floor((project.coordinates.lng + 180) * 10)}.png`
                                : `https://tile.openstreetmap.org/15/${Math.floor((45 + 90) * 10)}/${Math.floor((25 + 180) * 10)}.png`
                            }
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>
                )}
                <main className="px-6 py-6 space-y-8 min-h-[500px]">
                    {activeTab === 'survey' && (
                        <>
                            <section className="bg-white dark:bg-card-dark rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6 relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-primary"><User size={18} /></div>
                                        <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">{t('section_client_info')}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="p-2 rounded-xl transition-all bg-gray-100 dark:bg-surface-dark text-gray-500 hover:text-red-500"
                                            title="Șterge proiectul"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => setIsEditingInfo(!isEditingInfo)}
                                            className={`p-2 rounded-xl transition-all ${isEditingInfo ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 dark:bg-surface-dark text-gray-500 hover:text-primary'}`}
                                        >
                                            {isEditingInfo ? <Check size={16} /> : <Edit2 size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Client Name with Icon */}
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-1 flex items-center gap-1">
                                        <Briefcase size={10} />
                                        {t('label_client')}
                                    </label>
                                    {isEditingInfo ? (
                                        <>
                                            <div className="flex items-center gap-2 mb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={project.isClient ?? true}
                                                    onChange={(e) => setProject({...project, isClient: e.target.checked})}
                                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <span className="text-xs text-gray-500 dark:text-gray-400">Marker client (afiseaza buton Vezi detalii)</span>
                                            </div>
                                            <input 
                                                type="text"
                                                value={project.client}
                                                onChange={(e) => setProject({...project, client: e.target.value})}
                                                className="w-full mt-1 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xl font-black focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                            />
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{project.client}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ultima modificare: {project.updatedAt ? new Date(project.updatedAt).toLocaleString('ro-RO') : '-'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Address Section */}
                                <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-start gap-3 mb-4">
                                        <MapPin size={20} className="text-primary mt-0.5 shrink-0" />
                                        {isEditingInfo ? (
                                            <div className="flex-1">
                                                <input 
                                                    type="text"
                                                    value={project.address}
                                                    onChange={(e) => setProject({...project, address: e.target.value})}
                                                    className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-base font-medium focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-base font-medium text-gray-700 dark:text-gray-300 leading-snug">{project.address}</p>
                                        )}
                                    </div>
                                    
                                    {!isEditingInfo && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={openWaze} 
                                                className="flex items-center justify-center gap-2 py-3 px-4 bg-[#33ccff]/10 hover:bg-[#33ccff]/20 text-[#0099cc] dark:text-[#33ccff] rounded-xl border border-[#33ccff]/20 transition-all active:scale-95 group shadow-sm backdrop-blur-sm"
                                            >
                                                <Navigation size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                                <span className="text-xs font-black uppercase tracking-wide">Waze</span>
                                            </button>
                                            <button 
                                                onClick={openMaps} 
                                                className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 rounded-xl border border-gray-200 dark:border-gray-700 transition-all active:scale-95 group shadow-sm hover:shadow-md"
                                            >
                                                <MapIcon size={18} className="text-green-600 dark:text-green-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                                <span className="text-xs font-black uppercase tracking-wide">Maps</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Phone Section - always show in edit mode, show if has value in view mode */}
                                {(phoneNumber || isEditingInfo) && (
                                <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-start gap-3 mb-4">
                                        <Phone size={20} className="text-primary mt-0.5 shrink-0" />
                                        {isEditingInfo ? (
                                            <div className="flex-1">
                                                <input 
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    placeholder="Număr de telefon"
                                                    className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-base font-medium focus:ring-2 focus:ring-primary outline-none dark:text-white" 
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-base font-medium text-gray-700 dark:text-gray-300 leading-snug">{phoneNumber}</p>
                                        )}
                                    </div>

                                    {!isEditingInfo && phoneNumber && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={callPhone} 
                                                className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 transition-all active:scale-95 shadow-sm"
                                            >
                                                <Phone size={18} />
                                                <span className="text-xs font-black uppercase tracking-wide">{t('btn_call')}</span>
                                            </button>
                                            <button 
                                                onClick={sendMsg} 
                                                className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20 transition-all active:scale-95 shadow-sm"
                                            >
                                                <MessageSquare size={18} />
                                                <span className="text-xs font-black uppercase tracking-wide">{t('btn_msg')}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                )}
                            </section>

                            {/* --- WEATHER WIDGET (Dynamic based on project location) --- */}
                            <section className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>

                                {weatherLoading ? (
                                    <div className="relative z-10 flex items-center justify-center h-32">
                                        <div className="animate-pulse text-blue-200">Se încarcă vremea...</div>
                                    </div>
                                ) : !project?.coordinates ? (
                                    <div className="relative z-10 flex items-center justify-center h-32">
                                        <div className="text-blue-200 text-sm">Locație neactualizată</div>
                                    </div>
                                ) : weather ? (
                                    <>
                                        <div className="relative z-10 flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MapPin size={14} className="text-blue-200" />
                                                    <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Prognoza Meteo</p>
                                                </div>
                                                <h3 className="text-3xl font-black mb-1">{weather.temperature}°C</h3>
                                                <p className="text-sm font-medium text-blue-100">{weather.description}</p>
                                                <p className="text-xs text-blue-200 mt-1">Se simte ca {weather.feelsLike}°C</p>
                                            </div>
                                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                                {weather.icon === 'sun' ? (
                                                    <Sun size={32} className="text-yellow-300" />
                                                ) : weather.icon === 'partlyCloudy' ? (
                                                    <CloudSun size={32} className="text-yellow-200" />
                                                ) : weather.icon === 'cloud' ? (
                                                    <Cloud size={32} className="text-blue-200" />
                                                ) : weather.icon === 'fog' ? (
                                                    <CloudFog size={32} className="text-gray-300" />
                                                ) : weather.icon === 'drizzle' ? (
                                                    <CloudDrizzle size={32} className="text-blue-300" />
                                                ) : weather.icon === 'rain' ? (
                                                    <CloudRain size={32} className="text-blue-400" />
                                                ) : weather.icon === 'snow' ? (
                                                    <Snowflake size={32} className="text-blue-100" />
                                                ) : weather.icon === 'storm' ? (
                                                    <CloudLightning size={32} className="text-purple-400" />
                                                ) : (
                                                    <Sun size={32} className="text-yellow-300" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mt-6">
                                            <div className="bg-black/20 rounded-xl p-2 flex flex-col items-center justify-center backdrop-blur-sm">
                                                <Wind size={14} className="text-blue-200 mb-1" />
                                                <span className="text-xs font-bold">{weather.windSpeed}</span>
                                                <span className="text-[8px] text-blue-200 uppercase">km/h</span>
                                            </div>
                                            <div className="bg-black/20 rounded-xl p-2 flex flex-col items-center justify-center backdrop-blur-sm">
                                                <Droplets size={14} className="text-blue-200 mb-1" />
                                                <span className="text-xs font-bold">{weather.humidity}%</span>
                                                <span className="text-[8px] text-blue-200 uppercase">umid.</span>
                                            </div>
                                            <div className="bg-black/20 rounded-xl p-2 flex flex-col items-center justify-center backdrop-blur-sm">
                                                <Cloud size={14} className="text-blue-200 mb-1" />
                                                <span className="text-xs font-bold">{weather.cloudCover}%</span>
                                                <span className="text-[8px] text-blue-200 uppercase">nori</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="relative z-10 flex items-center justify-center h-32">
                                        <div className="text-blue-200">Vreme indisponibilă</div>
                                    </div>
                                )}
                            </section>

                            {/* Section 1: Field Measurements */}
                            <section className="bg-white dark:bg-card-dark rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-primary"><Ruler size={18} /></div>
                                    <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">{t('section_measurements')}</h3>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <InputBox label={t('label_area')} unit="MP" value={project.survey.area} onChange={(v) => updateSurvey('area', v)} />
                                    <InputBox label={t('label_perimeter')} unit="M" value={project.survey.perimeter} onChange={(v) => updateSurvey('perimeter', v)} />
                                    <div className="col-span-2">
                                        <InputBox label={t('label_slope')} unit="%" value={project.survey.slope} onChange={(v) => updateSurvey('slope', v)} />
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{t('label_others')}</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputBox label={t('label_length')} unit="M" value={project.survey.length || ''} onChange={(v) => updateSurvey('length', v)} />
                                        <InputBox label={t('label_width')} unit="M" value={project.survey.width || ''} onChange={(v) => updateSurvey('width', v)} />
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Topography */}
                            <section className="bg-white dark:bg-card-dark rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-primary"><Mountain size={18} /></div>
                                    <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">{t('section_topography')}</h3>
                                </div>
                                
                                {/* Relief Types */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('label_relief')}</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { key: 'Plan', label: t('relief_flat'), icon: MoveRight },
                                            { key: 'Ușoară', label: t('relief_slight'), icon: TrendingUp },
                                            { key: 'Abruptă', label: t('relief_steep'), icon: Activity }
                                        ].map((item) => (
                                            <SelectableBox 
                                                selected={project.survey.topography === item.key} 
                                                onClick={() => updateSurvey('topography', item.key)}
                                            >
                                                <item.icon size={20} className={`mb-1 ${project.survey.topography === item.key ? 'text-primary' : 'text-gray-400'}`} />
                                                <span className="text-xs font-bold">{item.label}</span>
                                            </SelectableBox>
                                        ))}
                                    </div>
                                </div>

                                {/* Soil Type */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('label_soil')}</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { key: 'Clay', label: t('soil_clay'), icon: Layers },
                                            { key: 'Sandy', label: t('soil_sandy'), icon: GripHorizontal },
                                            { key: 'Stâncos', label: t('soil_stancos'), icon: Mountain }
                                        ].map((item) => (
                                            <SelectableBox 
                                                selected={project.survey.soilType === item.key} 
                                                onClick={() => updateSurvey('soilType', item.key)}
                                            >
                                                <item.icon size={20} className={`mb-1 ${project.survey.soilType === item.key ? 'text-primary' : 'text-gray-400'}`} />
                                                <span className="text-xs font-bold">{item.label}</span>
                                            </SelectableBox>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: Vegetation */}
                            <section className="bg-white dark:bg-card-dark rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-primary"><Trees size={18} /></div>
                                    <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">{t('section_vegetation')}</h3>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { key: 'trees', label: t('veg_trees'), icon: Trees },
                                        { key: 'shrubs', label: t('veg_shrubs'), icon: Sprout },
                                        { key: 'grass', label: t('veg_grass'), icon: Leaf }
                                    ].map((item) => (
                                        <SelectableBox 
                                            selected={project.survey.vegetation[item.key as keyof typeof project.survey.vegetation]} 
                                            onClick={() => updateVegetation(item.key as keyof SurveyData['vegetation'])}
                                        >
                                            <item.icon size={20} className={`mb-1 ${project.survey.vegetation[item.key as keyof typeof project.survey.vegetation] ? 'text-primary' : 'text-gray-400'}`} />
                                            <span className="text-xs font-bold">{item.label}</span>
                                        </SelectableBox>
                                    ))}
                                </div>
                            </section>

                            {/* Section 4: Obstacles */}
                            <section className="bg-white dark:bg-card-dark rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-primary"><Activity size={18} /></div>
                                    <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">{t('section_obstacles')}</h3>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { key: 'rocks', label: t('obs_rocks'), icon: Mountain },
                                        { key: 'fences', label: t('obs_fences'), icon: Layers },
                                        { key: 'water', label: t('obs_water'), icon: Droplets }
                                    ].map((item) => (
                                        <SelectableBox 
                                            selected={project.survey.obstacles[item.key as keyof typeof project.survey.obstacles]} 
                                            onClick={() => {
                                                if (!project) return;
                                                setProject({
                                                    ...project,
                                                    survey: {
                                                        ...project.survey,
                                                        obstacles: {
                                                            ...project.survey.obstacles,
                                                            [item.key]: !project.survey.obstacles[item.key as keyof typeof project.survey.obstacles]
                                                        }
                                                    }
                                                });
                                            }}
                                        >
                                            <item.icon size={20} className={`mb-1 ${project.survey.obstacles[item.key as keyof typeof project.survey.obstacles] ? 'text-primary' : 'text-gray-400'}`} />
                                            <span className="text-xs font-bold">{item.label}</span>
                                        </SelectableBox>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'logistics' && (
                        <>
                            {/* MATERIALS */}
                            <section className="bg-white dark:bg-card-dark rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-primary"><Package size={18} /></div>
                                        <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">{t('section_materials')}</h3>
                                    </div>
                                    <button 
                                        onClick={() => setIsAddingMaterial(true)}
                                        className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                
                                {isAddingMaterial && (
                                    <div className="mb-4 p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-gray-700">
                                        <div className="space-y-3">
                                            {/* Material Search / Custom */}
                                            <div id="material-search-container" className="relative">
                                                <input 
                                                    type="text"
                                                    placeholder={isCustomMaterial ? 'Nume material' : 'Cauta material...'}
                                                    value={materialSearch}
                                                    onChange={(e) => {
                                                        setMaterialSearch(e.target.value);
                                                        setShowMaterialSuggestions(e.target.value.length > 0 && !isCustomMaterial);
                                                    }}
                                                    onFocus={() => materialSearch.length > 0 && !isCustomMaterial && setShowMaterialSuggestions(true)}
                                                    className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                                />
                                                
                                                {/* Suggestions Dropdown */}
                                                {showMaterialSuggestions && materialSuggestions.length > 0 && (
                                                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-card-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                                                        {materialSuggestions.map((item) => (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => {
                                                                    setNewMaterial({ ...item, quantity: 1, unit: item.unit || 'buc' });
                                                                    setMaterialSearch(item.name);
                                                                    setShowMaterialSuggestions(false);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 dark:text-white"
                                                            >
                                                                {item.name} {item.unit ? `(${item.unit})` : ''}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3">
                                                <input 
                                                    type="number"
                                                    placeholder="Cantitate"
                                                    value={newMaterial.quantity || ''}
                                                    onChange={(e) => setNewMaterial({...newMaterial, quantity: parseFloat(e.target.value) || 0})}
                                                    className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                                />
                                                <input 
                                                    type="text"
                                                    placeholder="Unitate"
                                                    value={newMaterial.unit || ''}
                                                    onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}
                                                    className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                                />
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={handleAddMaterial}
                                                    className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-primary/90 transition-all"
                                                >
                                                    Adauga
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setIsAddingMaterial(false);
                                                        setMaterialSearch('');
                                                        setNewMaterial({ name: '', quantity: 0, unit: '' });
                                                    }}
                                                    className="px-4 py-2 bg-gray-200 dark:bg-surface-dark text-gray-600 dark:text-gray-400 rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
                                                >
                                                    Anuleaza
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Material List */}
                                <div className="space-y-2">
                                    {project.logistics.materials.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <Package size={18} className="text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-bold dark:text-white">{item.name}</p>
                                                    <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteMaterial(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {project.logistics.materials.length === 0 && (
                                        <p className="text-center text-gray-400 py-4 text-sm">Nu ai materiale adaugate</p>
                                    )}
                                </div>
                            </section>
                            
                            {/* MACHINES */}
                            <section className="bg-white dark:bg-card-dark rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-primary"><Truck size={18} /></div>
                                        <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">Utilaje/Scule</h3>
                                    </div>
                                    <button 
                                        onClick={() => setIsAddingMachine(true)}
                                        className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                
                                {isAddingMachine && (
                                    <div className="mb-4 p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-gray-700">
                                        <div className="space-y-3">
                                            {/* Machine Search / Custom */}
                                            <div id="machine-search-container" className="relative">
                                                <input 
                                                    type="text"
                                                    placeholder="Cauta utilaj..."
                                                    value={machineSearch}
                                                    onChange={(e) => {
                                                        setMachineSearch(e.target.value);
                                                        setShowMachineSuggestions(e.target.value.length > 0);
                                                    }}
                                                    onFocus={() => machineSearch.length > 0 && setShowMachineSuggestions(true)}
                                                    className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none dark:text-white"
                                                />
                                                
                                                {/* Suggestions Dropdown */}
                                                {showMachineSuggestions && machineSuggestions.length > 0 && (
                                                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-card-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                                                        {machineSuggestions.map((item) => (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => {
                                                                    setNewMachine({ name: item.name, status: 'Activ' });
                                                                    setMachineSearch(item.name);
                                                                    setShowMachineSuggestions(false);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 dark:text-white"
                                                            >
                                                                {item.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={handleAddMachine}
                                                    className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-primary/90 transition-all"
                                                >
                                                    Adauga
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setIsAddingMachine(false);
                                                        setMachineSearch('');
                                                        setNewMachine({ name: '', status: 'Activ' });
                                                    }}
                                                    className="px-4 py-2 bg-gray-200 dark:bg-surface-dark text-gray-600 dark:text-gray-400 rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
                                                >
                                                    Anuleaza
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Machine List */}
                                <div className="space-y-2">
                                    {project.logistics.machines.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <Truck size={18} className="text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-bold dark:text-white">{item.name}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteMachine(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {project.logistics.machines.length === 0 && (
                                        <p className="text-center text-gray-400 py-4 text-sm">Nu ai utilaje adaugate</p>
                                    )}
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'gallery' && (
                        <>
                            {/* PHOTOS */}
                            <section className="bg-white dark:bg-card-dark rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-primary"><Camera size={18} /></div>
                                        <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">{t('section_photos')}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <button 
                                            onClick={handleAddPhoto}
                                            disabled={isUploading}
                                            className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all disabled:opacity-50"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                                
                                {project.photos && project.photos.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {project.photos.map((photo, index) => (
                                            <div 
                                                key={index} 
                                                onClick={() => setSelectedPhotoIndex(index)}
                                                className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-surface-dark cursor-pointer relative group"
                                            >
                                                <img src={photo} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ImageIcon size={24} className="text-white" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <Camera size={48} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Nu ai poze adaugate</p>
                                    </div>
                                )}
                            </section>
                            
                            {/* DOCUMENTS */}
                            <section className="bg-white dark:bg-card-dark rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-primary"><FolderOpen size={18} /></div>
                                        <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">{t('section_documents')}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="file" 
                                            ref={docFileInputRef}
                                            onChange={handleDocFileChange}
                                            accept=".pdf,.dwg,.dxf,.xls,.xlsx,.doc,.docx"
                                            className="hidden"
                                        />
                                        <button 
                                            onClick={handleUploadDoc}
                                            disabled={isUploadingDoc}
                                            className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all disabled:opacity-50"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                                
                                {project.documents && project.documents.length > 0 ? (
                                    <div className="space-y-2">
                                        {project.documents.map((doc) => (
                                            <div 
                                                key={doc.id} 
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                                                onClick={() => setPreviewDoc(doc)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {getFileIcon(doc.type)}
                                                    <div>
                                                        <p className="text-sm font-bold dark:text-white">{doc.name}</p>
                                                        <p className="text-xs text-gray-500">{doc.type.toUpperCase()} - {doc.size} - {doc.date}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteDocument(doc.id);
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <FolderOpen size={48} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Nu ai documente adaugate</p>
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {activeTab === 'notes' && (
                        <>
                            <section className="bg-white dark:bg-card-dark rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-primary"><ClipboardList size={18} /></div>
                                    <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">{t('section_notes')}</h3>
                                </div>
                                
                                <textarea 
                                    value={project.fieldNotes}
                                    onChange={(e) => setProject({...project, fieldNotes: e.target.value})}
                                    placeholder={'Adaugă notițe despre proiect...'}
                                    className="w-full h-64 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none dark:text-white resize-none"
                                />
                            </section>
                        </>
                    )}
                </main>
                
                {/* Floating Save Button */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Se salveaza...</span>
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>{t('btn_save')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {/* Photo Preview Modal */}
            {selectedPhotoIndex !== null && project.photos && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhotoIndex(null)}>
                    <button 
                        onClick={handleDeletePhoto}
                        className="absolute top-4 left-4 p-3 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-xl transition-all"
                    >
                        <Trash2 size={24} />
                    </button>
                    <img 
                        src={project.photos[selectedPhotoIndex]} 
                        alt="" 
                        className="max-w-full max-h-full object-contain rounded-xl"
                    />
                </div>
            )}
            
            {/* Document Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
                    <div className="bg-white dark:bg-card-dark rounded-2xl p-4 max-w-2xl w-full max-h-[80vh] overflow-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black dark:text-white">{previewDoc.name}</h3>
                            <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">
                                <X size={20} className="dark:text-white" />
                            </button>
                        </div>
                        {previewDoc.url ? (
                            previewDoc.type === 'pdf' ? (
                                <iframe src={previewDoc.url} className="w-full h-96 rounded-lg" />
                            ) : (
                                <a href={previewDoc.url} target="_blank" rel="noopener noreferrer" className="block p-8 text-center bg-gray-50 dark:bg-black/20 rounded-xl">
                                    <FileText size={48} className="mx-auto mb-2 text-primary" />
                                    <p className="font-bold dark:text-white">Deschide documentul</p>
                                </a>
                            )
                        ) : (
                            <p className="text-center text-gray-500">Documentul nu este disponibil</p>
                        )}
                    </div>
                </div>
            )}
            
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-5">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl shadow-lg">
                        <Check size={18} />
                        <span className="text-sm font-bold">{generatingPDF ? 'Se genereaza PDF...' : t('toast_saved')}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// UI Components
const InputBox = ({ label, value, unit, onChange }: { label: string; value: string; unit?: string; onChange: (value: string) => void }) => (
    <div className="bg-gray-50 dark:bg-black/20 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-800">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
        <div className="flex items-center gap-2 mt-1">
            <input 
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 bg-transparent text-lg font-bold dark:text-white outline-none"
            />
            {unit && <span className="text-xs font-bold text-gray-400">{unit}</span>}
        </div>
    </div>
);

const SelectableBox = ({ children, selected, onClick }: { children: React.ReactNode; selected: boolean; onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            selected 
                ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
        }`}
    >
        {children}
    </button>
);

export default ProjectDetails;
