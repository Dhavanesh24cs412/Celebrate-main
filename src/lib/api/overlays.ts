import { supabase } from '../supabase';
import { OverlayCollection, OverlayAsset } from '../../types';

export const getOverlayCollections = async (plannerProfileId: string) => {
  const { data, error } = await supabase
    .from('overlay_collections')
    .select('*')
    .eq('planner_profile_id', plannerProfileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as OverlayCollection[];
};

export const createOverlayCollection = async (collection: Omit<OverlayCollection, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('overlay_collections')
    .insert([collection])
    .select()
    .single();

  if (error) throw error;
  return data as OverlayCollection;
};

export const updateOverlayCollection = async (id: string, updates: Partial<Omit<OverlayCollection, 'id' | 'planner_profile_id' | 'created_at'>>) => {
  const { data, error } = await supabase
    .from('overlay_collections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as OverlayCollection;
};

export const deleteOverlayCollection = async (id: string) => {
  const { error } = await supabase
    .from('overlay_collections')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getOverlayAssets = async (plannerProfileId: string, collectionId?: string) => {
  let query = supabase
    .from('overlay_assets')
    .select('*')
    .eq('planner_profile_id', plannerProfileId);

  if (collectionId) {
    query = query.eq('collection_id', collectionId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data as OverlayAsset[];
};

export const createOverlayAsset = async (asset: Omit<OverlayAsset, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('overlay_assets')
    .insert([asset])
    .select()
    .single();

  if (error) throw error;
  return data as OverlayAsset;
};

export const deleteOverlayAsset = async (id: string, storagePath?: string) => {
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from('overlay-assets')
      .remove([storagePath]);
    
    if (storageError) {
      console.error('Failed to delete asset from storage', storageError);
    }
  }

  const { error } = await supabase
    .from('overlay_assets')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const uploadAssetFile = async (
  plannerProfileId: string, 
  collectionId: string, 
  assetId: string, 
  file: File,
  filename: string
) => {
  const filePath = `${plannerProfileId}/${collectionId}/${assetId}/${filename}`;
  
  const { data, error } = await supabase.storage
    .from('overlay-assets')
    .upload(filePath, file, { upsert: true });

  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('overlay-assets')
    .getPublicUrl(filePath);
    
  return { path: data.path, publicUrl };
};
