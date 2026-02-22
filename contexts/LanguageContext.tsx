
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

type Language = 'ro' | 'de';

const translations = {
    ro: {
        // Navigation
        nav_home: 'Acasă',
        nav_map: 'Hartă',
        nav_add: 'Adaugă',
        
        // Header
        role_title: 'Salut,',
        
        // Dashboard
        search_placeholder: 'Caută șantier, client sau ID...',
        active_sites_title: 'Șantiere Active',
        projects_count: 'PROIECTE',
        filter_all: 'Toate',
        filter_active: 'Active',
        filter_finished: 'Finalizate',
        no_results: 'Nu am găsit proiecte.',
        no_results_sub: 'Modifică filtrele de căutare.',
        list_title: 'Listă Proiecte',
        results_label: 'REZULTATE',
        
        // Statuses (Display)
        status_in_progress: 'În Lucru',
        status_on_hold: 'În Așteptare',
        status_finished: 'Finalizat',

        // Card
        stage_label: 'Stadiu',
        
        // Project Details
        details_title: 'Panou Proiect',
        view_map: 'VEZI LOCALIZARE',
        tab_survey: 'Info Proiect',
        tab_logistics: 'Logistică',
        tab_gallery: 'Fișiere', // Changed from Galerie
        tab_notes: 'Note',
        
        // Info / Survey Section
        section_client_info: 'Date Client & Locație',
        label_phone: 'Telefon Contact',
        btn_call: 'Apelează',
        btn_msg: 'SMS',
        btn_waze: 'Waze',
        btn_maps: 'Google Maps',
        btn_edit: 'Editează',
        btn_done: 'Gata',
        btn_export: 'Raport PDF',

        section_measurements: 'Măsurători Teren',
        label_area: 'Suprafață Teren',
        label_perimeter: 'Perimetru',
        label_slope: 'Înclinație (%)',
        label_others: 'Altele',
        label_length: 'Lungime',
        label_width: 'Lățime',
        
        section_topography: 'Topografie',
        label_relief: 'Relief',
        relief_flat: 'Plan',
        relief_slight: 'Ușoară',
        relief_steep: 'Abruptă',
        label_soil: 'Compoziție Sol',
        soil_clay: 'Argilos',
        soil_sandy: 'Nisipos',
        soil_stancos: 'Stâncos',
        
        label_vegetation: 'Vegetație',
        veg_trees: 'Arbori',
        veg_shrubs: 'Arbuști',
        veg_grass: 'Iarbă',

        section_obstacles: 'Obstacole',
        obs_trees: 'Copaci',
        obs_rocks: 'Roci',
        
        // Logistics Section
        section_materials: 'Materiale',
        section_machines: 'Utilaje',
        
        // Documents Section
        section_documents: 'Documente',
        
        // Vegetation Section
        section_vegetation: 'Vegetație',
        
        // Notes Section
        section_notes: 'Note',
        obs_fences: 'Garduri',
        obs_water: 'Apă',
        label_notes: 'Note Suplimentare',
        placeholder_notes: 'Menționați orice utilități, linii electrice...',
        
        // Logistics Section
        list_materials: 'Listă Materiale',
        list_machines: 'Utilaje',
        no_materials: 'Niciun material adăugat.',
        no_machines: 'Niciun utilaj alocat.',
        
        // Logistics Actions
        btn_add_item: 'Adaugă',
        btn_cancel: 'Anulează',
        btn_confirm: 'Confirmă',
        label_name: 'Nume',
        label_qty: 'Cantitate',
        label_unit: 'Unitate',
        label_machine_status: 'Status',
        status_active: 'Activ',
        status_repair: 'Reparație',
        status_inactive: 'Inactiv',
        label_suggestions: 'Din Catalog:',
        or_custom: 'sau adaugă manual',
        search_catalog: 'Caută material...',
        
        // New Logistics Translations
        label_select_catalog: 'Selectare din Catalog',
        label_custom_material: 'Material Nou (Manual)',
        btn_add_custom: 'Nu există? Adaugă manual',
        btn_back_catalog: 'Înapoi la căutare',
        
        // Gallery Section
        section_photos: 'Galerie Foto',
        section_docs: 'Documente & Schițe',
        btn_upload: 'Adaugă Poze',
        btn_upload_doc: 'Adaugă Fișier',
        no_docs: 'Niciun document atașat.',
        
        // Notes Section
        section_field_notes: 'Jurnal de Șantier',
        placeholder_field_notes: 'Introduceți observațiile zilnice, probleme întâmpinate sau instrucțiuni...',
        
        // Actions
        btn_save: 'SALVEAZĂ DATELE',
        btn_saving: 'SE SALVEAZĂ...',
        
        // Edit/New Project
        new_project_title: 'Proiect Nou',
        label_project_name: 'Nume Proiect',
        label_client: 'Client',
        label_address: 'Adresă',
        note_coordinates: 'Notă: În acest demo, coordonatele hărții sunt generate automat lângă Berlin.',
        label_internal_id: 'ID Intern (Opțional)',
        label_status: 'Stadiu',
        btn_create: 'CREAZĂ PROIECT',
        
        // Map
        map_title: 'Harta Clienți',
        btn_view_details: 'VEZI DETALII',

        // Settings / Catalog
        settings_title: 'Catalog Predefinit',
        tab_catalog_materials: 'Materiale',
        tab_catalog_machines: 'Utilaje/Scule',
        settings_subtitle: 'Gestionează lista standard de resurse.',
        placeholder_item_name: 'Nume element...',
        placeholder_item_unit: 'Unitate...',
        btn_add_preset: 'Adaugă în Listă',
        search_catalog_placeholder: 'Caută în catalog...'
    },
    de: {
        // Navigation
        nav_home: 'Startseite',
        nav_map: 'Karte',
        nav_add: 'Erstellen',
        
        // Header
        role_title: 'Hallo,',
        
        // Dashboard
        search_placeholder: 'Suche Baustelle, Kunde oder ID...',
        active_sites_title: 'Aktive Baustellen',
        projects_count: 'PROJEKTE',
        filter_all: 'Alle',
        filter_active: 'Aktiv',
        filter_finished: 'Fertig',
        no_results: 'Keine Projekte gefunden.',
        no_results_sub: 'Suchfilter ändern.',
        list_title: 'Projektliste',
        results_label: 'ERGEBNISSE',
        
        // Statuses (Display)
        status_in_progress: 'In Arbeit',
        status_on_hold: 'Wartend',
        status_finished: 'Abgeschlossen',

        // Card
        stage_label: 'Phase',
        
        // Project Details
        details_title: 'Projekt-Dashboard',
        view_map: 'KARTE ANZEIGEN',
        tab_survey: 'Projektinfo',
        tab_logistics: 'Logistik',
        tab_gallery: 'Dateien', // Changed from Galerie
        tab_notes: 'Notizen',

        // Info / Survey
        section_client_info: 'Kunde & Standort',
        label_phone: 'Telefon',
        btn_call: 'Anrufen',
        btn_msg: 'SMS',
        btn_waze: 'Waze',
        btn_maps: 'Google Maps',
        btn_edit: 'Bearbeiten',
        btn_done: 'Fertig',
        btn_export: 'PDF Export',
        
        // Survey Section
        section_measurements: 'Geländemaße',
        label_area: 'Grundfläche',
        label_perimeter: 'Umfang',
        label_slope: 'Neigung (%)',
        label_others: 'Andere',
        label_length: 'Länge',
        label_width: 'Breite',

        section_topography: 'Topographie',
        label_relief: 'Relief',
        relief_flat: 'Flach',
        relief_slight: 'Leicht',
        relief_steep: 'Steil',
        label_soil: 'Bodenbeschaffenheit',
        soil_clay: 'Lehmig',
        soil_sandy: 'Sandig',
        soil_stancos: 'Steinig',
        
        label_vegetation: 'Vegetation',
        veg_trees: 'Bäume',
        veg_shrubs: 'Sträucher',
        veg_grass: 'Gras',

        section_obstacles: 'Hindernisse',
        obs_trees: 'Bäume',
        obs_rocks: 'Felsen',
        
        // Logistics Section
        section_materials: 'Materialien',
        section_machines: 'Maschinen',
        
        // Documents Section
        section_documents: 'Dokumente',
        
        // Vegetation Section
        section_vegetation: 'Vegetation',
        
        // Notes Section
        section_notes: 'Notizen',
        
        list_materials: 'Materialliste',
        list_machines: 'Maschinen',
        no_materials: 'Keine Materialien hinzugefügt.',
        no_machines: 'Keine Maschinen zugewiesen.',

        // Logistics Actions
        btn_add_item: 'Hinzufügen',
        btn_cancel: 'Abbrechen',
        btn_confirm: 'Bestätigen',
        label_name: 'Name',
        label_qty: 'Menge',
        label_unit: 'Einheit',
        label_machine_status: 'Status',
        status_active: 'Aktiv',
        status_repair: 'Reparatur',
        status_inactive: 'Inaktiv',
        label_suggestions: 'Aus Katalog:',
        or_custom: 'oder manuell hinzufügen',
        search_catalog: 'Material suchen...',
        
        // New Logistics Translations
        label_select_catalog: 'Aus Katalog wählen',
        label_custom_material: 'Neues Material (Manuell)',
        btn_add_custom: 'Nicht gefunden? Manuell hinzufügen',
        btn_back_catalog: 'Zurück zur Suche',
        
        // Gallery Section
        section_photos: 'Fotogalerie',
        section_docs: 'Dokumente & Pläne',
        btn_upload: 'Fotos Hinzufügen',
        btn_upload_doc: 'Datei Hinzufügen',
        no_docs: 'Keine Dokumente.',
        
        // Notes Section
        section_field_notes: 'Bautagebuch',
        placeholder_field_notes: 'Geben Sie Beobachtungen von der Baustelle ein...',
        
        // Actions
        btn_save: 'DATEN SPEICHERN',
        btn_saving: 'SPEICHERN...',
        
        // Edit/New Project
        new_project_title: 'Neues Projekt',
        label_project_name: 'Projektname',
        label_client: 'Kunde',
        label_address: 'Adresse',
        note_coordinates: 'Hinweis: In dieser Demo werden die Koordinaten automatisch in der Nähe von Berlin generiert.',
        label_internal_id: 'Interne ID (Optional)',
        label_status: 'Status',
        btn_create: 'PROJEKT ERSTELLEN',
        
        // Map
        map_title: 'Kundenkarte',
        btn_view_details: 'DETAILS ANZEIGEN',

        // Settings / Catalog
        settings_title: 'Katalogeinstellungen',
        tab_catalog_materials: 'Materialien',
        tab_catalog_machines: 'Maschinen',
        settings_subtitle: 'Verwalten Sie die Standardressourcenliste.',
        placeholder_item_name: 'Artikelname...',
        placeholder_item_unit: 'Einheit...',
        btn_add_preset: 'Zur Liste hinzufügen',
        search_catalog_placeholder: 'Im Katalog suchen...'
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof translations['ro']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('ro');

    // Performance diagnostic: track language changes (runs once on mount)
    useEffect(() => {
        console.log('[LanguageContext] Mounted | Language:', language);
    }, [language]);

    const t = useCallback((key: keyof typeof translations['ro']) => {
        return translations[language][key] || key;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
