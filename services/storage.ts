
import { Project, initialSurveyData, CatalogData, CatalogItem } from '../types';
import { 
    saveProjectToDatabase, 
    getProjectsFromDatabase, 
    deleteProjectFromDatabase,
    saveCatalogToDatabase,
    getCatalogFromDatabase,
    checkDatabaseConnection 
} from './supabase';

const STORAGE_KEY = 'bautrupp_projects_v10'; // v10 - with database sync
const CATALOG_KEY = 'bautrupp_catalog_v2';

// Default catalog with common materials and machines
const defaultCatalog: CatalogData = {
    materials: [
        { id: '1', name: 'Ciment', unit: 'saci' },
        { id: '2', name: 'Nisip', unit: 'mc' },
        { id: '3', name: 'Pietriș', unit: 'mc' },
        { id: '4', name: 'Beton', unit: 'mc' },
        { id: '5', name: 'Oțel beton', unit: 'kg' },
        { id: '6', name: 'Cherestea', unit: 'mc' },
        { id: '7', name: 'Pal', unit: 'buc' },
        { id: '8', name: 'Șuruburi', unit: 'cutii' },
        { id: '9', name: 'Cuie', unit: 'kg' },
        { id: '10', name: 'Vopsea', unit: 'l' },
        { id: '11', name: 'Grund', unit: 'l' },
        { id: '12', name: 'Diluant', unit: 'l' },
        { id: '13', name: 'Gips', unit: 'saci' },
        { id: '14', name: 'Hidroizolație', unit: 'role' },
        { id: '15', name: 'Folie PVC', unit: 'mp' },
        { id: '16', name: 'Țeavă PVC', unit: 'buc' },
        { id: '17', name: 'Fitinguri PVC', unit: 'buc' },
        { id: '18', name: 'Căldare', unit: 'buc' },
        { id: '19', name: 'Găleți', unit: 'buc' },
        { id: '20', name: 'Mănuși', unit: 'perechi' },
    ],
    machines: [
        { id: '1', name: 'Betonieră' },
        { id: '2', name: 'Fierăstrău circular' },
        { id: '3', name: 'Fierăstrău pendular' },
        { id: '4', name: 'Mașină de găurit' },
        { id: '5', name: 'Șlefuitor' },
        { id: '6', name: 'Flex' },
        { id: '7', name: 'Generator' },
        { id: '8', name: 'Compresor' },
        { id: '9', name: 'Pompe de beton' },
        { id: '10', name: 'Excavator' },
        { id: '11', name: 'Încărcător frontal' },
        { id: '12', name: 'Autobetonieră' },
        { id: '13', name: 'Basculantă' },
        { id: '14', name: 'Platformă' },
        { id: '15', name: 'Motocoasă' },
        { id: '16', name: 'Freză de zăpadă' },
    ]
};

// Track if database is connected
let dbConnected = false;
let dbCheckDone = false;

// Check database connection on first use
const checkDbConnection = async (): Promise<boolean> => {
    if (dbCheckDone) return dbConnected;
    
    const result = await checkDatabaseConnection();
    dbConnected = result.connected;
    dbCheckDone = true;
    
    console.log('[Storage] Database connected:', dbConnected);
    return dbConnected;
};

// Performance diagnostic: track storage calls
let storageCallCount = 0;
const logStorageCall = (fnName: string) => {
    storageCallCount++;
    console.log(`[Storage] ${fnName} called (total: ${storageCallCount})`);
};

// --- PROJECTS LOGIC ---

const seedData: Project[] = [];

export const getProjects = async (): Promise<Project[]> => {
    logStorageCall('getProjects');
    
    // Try database first
    const isDbConnected = await checkDbConnection();
    
    if (isDbConnected) {
        console.log('[Storage] Fetching from database...');
        const dbProjects = await getProjectsFromDatabase();
        
        if (dbProjects.length > 0) {
            // Also save to localStorage as backup
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dbProjects));
            return dbProjects;
        }
    }
    
    // Fallback to localStorage
    console.log('[Storage] Fetching from localStorage...');
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
        return seedData;
    }
    return JSON.parse(data);
};

export const getProjectById = async (id: string): Promise<Project | undefined> => {
    logStorageCall('getProjectById');
    const projects = await getProjects();
    return projects.find(p => p.id === id);
};

export const saveProject = async (project: Project): Promise<void> => {
    logStorageCall('saveProject');
    
    project.updatedAt = Date.now();
    
    const isDbConnected = await checkDbConnection();
    
    // Always save to localStorage as backup
    const projects = await getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    
    if (index >= 0) {
        projects[index] = project;
    } else {
        projects.push(project);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    
    // Try to save to database
    if (isDbConnected) {
        console.log('[Storage] Saving to database...');
        const result = await saveProjectToDatabase(project);
        if (!result.success) {
            console.warn('[Storage] Database save failed:', result.error);
        }
    } else {
        console.log('[Storage] Database not connected, saved locally only');
    }
};

export const createNewProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    const newProject: Project = { 
        ...project, 
        id: Date.now().toString(),
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    await saveProject(newProject);
    return newProject;
};

export const deleteProject = async (id: string): Promise<void> => {
    const projects = await getProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // Try to delete from database
    const isDbConnected = await checkDbConnection();
    if (isDbConnected) {
        await deleteProjectFromDatabase(id);
    }
};

// --- CATALOG LOGIC ---

export const getCatalog = async (): Promise<CatalogData> => {
    logStorageCall('getCatalog');
    
    const isDbConnected = await checkDbConnection();
    
    // Try database first
    if (isDbConnected) {
        const dbCatalog = await getCatalogFromDatabase();
        if (dbCatalog) {
            localStorage.setItem(CATALOG_KEY, JSON.stringify(dbCatalog));
            return dbCatalog;
        }
    }
    
    // Fallback to localStorage
    const data = localStorage.getItem(CATALOG_KEY);
    if (!data) {
        // Save default catalog to localStorage
        localStorage.setItem(CATALOG_KEY, JSON.stringify(defaultCatalog));
        
        // Try to save default catalog to database
        if (isDbConnected) {
            await saveCatalogToDatabase(defaultCatalog);
        }
        
        return defaultCatalog;
    }
    return JSON.parse(data);
};

export const saveCatalog = async (data: CatalogData): Promise<void> => {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(data));
    
    // Try to save to database
    const isDbConnected = await checkDbConnection();
    if (isDbConnected) {
        await saveCatalogToDatabase(data);
    }
};
