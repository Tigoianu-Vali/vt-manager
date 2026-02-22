
export type ProjectStatus = 'În Lucru' | 'În Așteptare' | 'Finalizat';

export interface MaterialItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
}

export interface MachineItem {
    id: string;
    name: string;
    status: 'Activ' | 'Reparație' | 'Inactiv';
}

export interface DocumentItem {
    id: string;
    name: string;
    type: 'pdf' | 'dwg' | 'doc' | 'xls';
    size: string;
    date: string;
    url?: string; // URL for uploaded files
}

// Catalog Types (Global Presets)
export interface CatalogItem {
    id: string;
    name: string;
    unit?: string; // Only for materials
}

export interface CatalogData {
    materials: CatalogItem[];
    machines: CatalogItem[];
}

export interface SurveyData {
    area: string; // MP total teren
    perimeter: string;
    slope: string;
    
    // New dimensions
    length: string;
    width: string;

    soilType: 'Clay' | 'Sandy' | 'Stâncos' | string;
    topography: 'Plan' | 'Ușoară' | 'Abruptă' | string;
    
    // Updated obstacles/vegetation
    vegetation: {
        trees: boolean;
        shrubs: boolean;
        grass: boolean;
    };
    
    obstacles: {
        rocks: boolean;
        fences: boolean;
        water: boolean;
    };
    notes: string;
}

export interface Project {
    id: string;
    customId?: string; // e.g., DE-402-24
    name: string;
    client: string;
    phone?: string; // Optional phone number
    address: string;
    isClient: boolean; // Mark if this is a client location
    coordinates?: {
        lat: number;
        lng: number;
    };
    status: ProjectStatus;
    progress: number; // 0-100
    currentStage: string; // e.g., "Finalizare Structură"
    image: string;
    photos: string[]; // Array of photo URLs
    survey: SurveyData;
    logistics: {
        materials: MaterialItem[];
        machines: MachineItem[];
    };
    documents: DocumentItem[]; // New field for files
    fieldNotes: string;
    createdAt: number; // Timestamp for sorting
    updatedAt: number;
}

export const initialSurveyData: SurveyData = {
    area: '',
    perimeter: '',
    slope: '',
    length: '',
    width: '',
    soilType: '',
    topography: 'Plan',
    vegetation: { trees: false, shrubs: false, grass: false },
    obstacles: { rocks: false, fences: false, water: false },
    notes: ''
};
