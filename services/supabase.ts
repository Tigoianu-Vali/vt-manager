import { createClient } from '@supabase/supabase-js';
import { Project, MaterialItem, MachineItem, CatalogData } from '../types';

// Supabase configuration - use environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wvswbytkxjkvagjkcoon.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2c3dieXRreGprdmFnamtjb29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDQ1NzcsImV4cCI6MjA4NjkyMDU3N30.YuklNE74zWBAK6lcCd5G_wT7cTrISbQ7gSFDBuTlotw';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Debug: Log Supabase connection status
console.log('[Supabase] Initialized with URL:', supabaseUrl);

// Debug: List buckets
export const listBuckets = async () => {
    try {
        const { data, error } = await supabase.storage.listBuckets();
        console.log('Buckets:', data, error);
        return data;
    } catch (e) {
        console.error('Error listing buckets:', e);
        return null;
    }
};

// Upload image to Supabase Storage
export const uploadImage = async (file: File, bucket: string = 'images'): Promise<string | null> => {
    try {
        console.log('Uploading to bucket:', bucket, 'file:', file.name);
        
        const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
            });

        if (error) {
            console.error('Supabase upload error:', error.message, error);
            alert(`Eroare upload: ${error.message}`);
            return null;
        }

        console.log('Upload success:', data);

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        console.log('Public URL:', urlData.publicUrl);
        return urlData.publicUrl;
    } catch (error: any) {
        console.error('Upload error:', error);
        alert(`Eroare: ${error.message || 'Nu s-a putut încărca fișierul'}`);
        return null;
    }
};

// Delete image from Supabase Storage
export const deleteImage = async (imageUrl: string, bucket: string = 'images'): Promise<boolean> => {
    try {
        // Extract file name from URL
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];

        const { error } = await supabase.storage
            .from(bucket)
            .remove([fileName]);

        if (error) {
            console.error('Supabase delete error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Delete error:', error);
        return false;
    }
};

// ============ DATABASE OPERATIONS FOR PROJECTS ============

// Table name
const PROJECTS_TABLE = 'projects';

// Check if database table exists and has data
export const checkDatabaseConnection = async (): Promise<{connected: boolean, count: number}> => {
    try {
        const { data, error, count } = await supabase
            .from(PROJECTS_TABLE)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.log('[Database] Table not found or error:', error.message);
            return { connected: false, count: 0 };
        }
        
        console.log('[Database] Connected, projects count:', count);
        return { connected: true, count: count || 0 };
    } catch (e) {
        console.error('[Database] Connection error:', e);
        return { connected: false, count: 0 };
    }
};

// Save project to database
export const saveProjectToDatabase = async (project: Project): Promise<{success: boolean, error?: string}> => {
    try {
        console.log('[Database] Saving project:', project.id, project.name);
        
        const projectData = {
            id: project.id,
            name: project.name,
            client: project.client,
            phone: project.phone || null,
            address: project.address,
            is_client: project.isClient,
            coordinates: project.coordinates,
            status: project.status,
            progress: project.progress,
            current_stage: project.currentStage,
            image: project.image,
            photos: project.photos,
            survey: project.survey,
            logistics_materials: project.logistics.materials,
            logistics_machines: project.logistics.machines,
            documents: project.documents,
            field_notes: project.fieldNotes,
            created_at: new Date(project.createdAt).toISOString(),
            updated_at: new Date(project.updatedAt).toISOString()
        };
        
        console.log('[Database] Saving project data, phone:', project.phone);

        const { data, error } = await supabase
            .from(PROJECTS_TABLE)
            .upsert(projectData, { onConflict: 'id' })
            .select();

        if (error) {
            console.error('[Database] Save error:', error);
            return { success: false, error: error.message };
        }

        console.log('[Database] Project saved successfully:', data);
        return { success: true };
    } catch (e: any) {
        console.error('[Database] Save exception:', e);
        return { success: false, error: e.message };
    }
};

// Get all projects from database
export const getProjectsFromDatabase = async (): Promise<Project[]> => {
    try {
        console.log('[Database] Fetching projects...');
        
        const { data, error } = await supabase
            .from(PROJECTS_TABLE)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Database] Fetch error:', error);
            return [];
        }

        if (!data || data.length === 0) {
            console.log('[Database] No projects found');
            return [];
        }

        // Transform database data back to Project type
        const projects: Project[] = data.map((row: any) => {
            console.log('[Database] Raw row phone:', row.phone);
            return {
                id: row.id,
                name: row.name,
                client: row.client,
                phone: row.phone || undefined,
                address: row.address,
                isClient: row.is_client,
                coordinates: row.coordinates,
                status: row.status,
                progress: row.progress,
                currentStage: row.current_stage,
                image: row.image,
                photos: row.photos || [],
                survey: row.survey,
                logistics: {
                    materials: row.logistics_materials || [],
                    machines: row.logistics_machines || []
                },
                documents: row.documents || [],
                fieldNotes: row.field_notes || '',
                createdAt: new Date(row.created_at).getTime(),
                updatedAt: new Date(row.updated_at).getTime()
            };
        });

        console.log('[Database] Projects loaded:', projects.length);
        return projects;
    } catch (e) {
        console.error('[Database] Fetch exception:', e);
        return [];
    }
};

// Delete project from database
export const deleteProjectFromDatabase = async (id: string): Promise<{success: boolean, error?: string}> => {
    try {
        console.log('[Database] Deleting project:', id);
        
        const { error } = await supabase
            .from(PROJECTS_TABLE)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[Database] Delete error:', error);
            return { success: false, error: error.message };
        }

        console.log('[Database] Project deleted:', id);
        return { success: true };
    } catch (e: any) {
        console.error('[Database] Delete exception:', e);
        return { success: false, error: e.message };
    }
};

// ============ DATABASE OPERATIONS FOR CATALOG ============

const CATALOG_TABLE = 'catalog';

// Save catalog to database
export const saveCatalogToDatabase = async (catalog: CatalogData): Promise<{success: boolean, error?: string}> => {
    try {
        console.log('[Database] Saving catalog...');
        
        const catalogData = {
            id: 'default',
            materials: catalog.materials,
            machines: catalog.machines,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(CATALOG_TABLE)
            .upsert(catalogData, { onConflict: 'id' })
            .select();

        if (error) {
            console.error('[Database] Catalog save error:', error);
            return { success: false, error: error.message };
        }

        console.log('[Database] Catalog saved:', data);
        return { success: true };
    } catch (e: any) {
        console.error('[Database] Catalog save exception:', e);
        return { success: false, error: e.message };
    }
};

// Get catalog from database
export const getCatalogFromDatabase = async (): Promise<CatalogData | null> => {
    try {
        console.log('[Database] Fetching catalog...');
        
        const { data, error } = await supabase
            .from(CATALOG_TABLE)
            .select('*')
            .eq('id', 'default')
            .single();

        if (error) {
            console.log('[Database] Catalog fetch error:', error.message);
            return null;
        }

        console.log('[Database] Catalog loaded:', data);
        return {
            materials: data.materials || [],
            machines: data.machines || []
        };
    } catch (e) {
        console.error('[Database] Catalog fetch exception:', e);
        return null;
    }
};
