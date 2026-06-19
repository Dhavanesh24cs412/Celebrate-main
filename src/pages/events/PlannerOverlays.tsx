import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { OverlayCollection, OverlayAsset } from '../../types';
import { getOverlayCollections, createOverlayCollection, updateOverlayCollection, deleteOverlayCollection, getOverlayAssets, createOverlayAsset, deleteOverlayAsset, uploadAssetFile } from '../../lib/api/overlays';
import { Layers, Plus, Trash2, ArrowLeft, UploadCloud, Search, Filter, Edit2, X, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  'Furniture',
  'Floral',
  'Lighting',
  'Backdrop',
  'Stage Decor',
  'Seating',
  'Entrance Decor',
  'Props',
  'Custom'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/svg+xml', 'image/webp'];

export const PlannerOverlays = () => {
  const { profile } = useAuth();
  const [collections, setCollections] = useState<OverlayCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<OverlayCollection | null>(null);
  const [assets, setAssets] = useState<OverlayAsset[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & UI State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [collectionModal, setCollectionModal] = useState<{ isOpen: boolean, collection?: OverlayCollection }>({ isOpen: false });
  const [uploadModal, setUploadModal] = useState<{ isOpen: boolean, file: File | null, error: string | null }>({ isOpen: false, file: null, error: null });
  
  // Form State
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [assetCategory, setAssetCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    if (profile?.id) loadCollections();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedCollection && profile?.id) loadAssets(selectedCollection.id);
  }, [selectedCollection, profile?.id]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await getOverlayCollections(profile!.id);
      setCollections(data);
    } catch (error) {
      showToast('Failed to load collections', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async (collectionId: string) => {
    setLoading(true);
    try {
      const data = await getOverlayAssets(profile!.id, collectionId);
      setAssets(data);
    } catch (error) {
      showToast('Failed to load assets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCollection = async () => {
    if (!colName.trim() || !profile) return;
    
    try {
      if (collectionModal.collection) {
        // Edit
        const updated = await updateOverlayCollection(collectionModal.collection.id, {
          name: colName,
          description: colDesc || null
        });
        setCollections(collections.map(c => c.id === updated.id ? updated : c));
        if (selectedCollection?.id === updated.id) setSelectedCollection(updated);
        showToast('Collection updated');
      } else {
        // Create
        const newCol = await createOverlayCollection({
          planner_profile_id: profile.id,
          name: colName,
          description: colDesc || null,
          thumbnail_url: null,
          is_active: true
        });
        setCollections([newCol, ...collections]);
        showToast('Collection created');
      }
      setCollectionModal({ isOpen: false });
    } catch (error) {
      showToast('Failed to save collection', 'error');
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Delete this collection and all its assets? This cannot be undone.')) return;
    try {
      await deleteOverlayCollection(id);
      setCollections(collections.filter(c => c.id !== id));
      if (selectedCollection?.id === id) setSelectedCollection(null);
      showToast('Collection deleted');
    } catch (error) {
      showToast('Failed to delete collection', 'error');
    }
  };

  const openCollectionModal = (col?: OverlayCollection) => {
    setColName(col?.name || '');
    setColDesc(col?.description || '');
    setCollectionModal({ isOpen: true, collection: col });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadModal({ isOpen: true, file: null, error: 'Only PNG, SVG, and WEBP files are allowed.' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadModal({ isOpen: true, file: null, error: 'File exceeds 5MB size limit.' });
      return;
    }

    setUploadModal({ isOpen: true, file, error: null });
    setAssetCategory(CATEGORIES[0]);
    setCustomCategory('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadAsset = async () => {
    const { file } = uploadModal;
    if (!file || !selectedCollection || !profile) return;
    
    const finalCategory = assetCategory === 'Custom' ? customCategory.trim() : assetCategory;
    if (!finalCategory) {
      setUploadModal(prev => ({ ...prev, error: 'Please select or enter a category.' }));
      return;
    }

    setUploading(true);
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const assetId = crypto.randomUUID();
      const ext = file.name.split('.').pop() || 'png';
      
      const { publicUrl } = await uploadAssetFile(
        profile.id,
        selectedCollection.id,
        assetId,
        file,
        `original.${ext}`
      );

      const newAsset = await createOverlayAsset({
        planner_profile_id: profile.id,
        collection_id: selectedCollection.id,
        category: finalCategory,
        asset_type: 'image',
        asset_origin: 'uploaded',
        name: file.name,
        image_url: publicUrl,
        thumbnail_url: null,
        width: img.width,
        height: img.height,
        file_size: file.size,
        mime_type: file.type,
        tags: [],
        is_active: true
      });

      setAssets([newAsset, ...assets]);
      showToast('Asset uploaded successfully');
      setUploadModal({ isOpen: false, file: null, error: null });
      
      // Update collection thumbnail if it's the first asset
      if (!selectedCollection.thumbnail_url) {
         const updated = await updateOverlayCollection(selectedCollection.id, { thumbnail_url: publicUrl });
         setCollections(collections.map(c => c.id === updated.id ? updated : c));
         setSelectedCollection(updated);
      }
      
    } catch (error) {
      setUploadModal(prev => ({ ...prev, error: 'Failed to upload asset. Please try again.' }));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAsset = async (asset: OverlayAsset) => {
    if (!confirm('Delete this asset?')) return;
    try {
      const ext = asset.mime_type?.split('/')[1] || 'png';
      const storagePath = `${asset.planner_profile_id}/${asset.collection_id}/${asset.id}/original.${ext}`;
      await deleteOverlayAsset(asset.id, storagePath);
      setAssets(assets.filter(a => a.id !== asset.id));
      showToast('Asset deleted');
    } catch (error) {
      showToast('Failed to delete asset', 'error');
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? a.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {!selectedCollection ? (
        // Collections View
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-poppins font-bold text-text flex items-center gap-2">
                <Layers className="w-6 h-6 text-primary" /> Overlay Manager
              </h1>
              <p className="text-sm text-gray-500 mt-1">{collections.length} Collections Total</p>
            </div>
            <button
              onClick={() => openCollectionModal()}
              className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 justify-center"
            >
              <Plus className="w-4 h-4" /> New Collection
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : collections.length === 0 ? (
             <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-lg mx-auto">
               <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-text">No Collections Yet</h3>
               <p className="text-gray-500 mb-6">Create your first collection to start organizing your design assets for the canvas.</p>
               <button onClick={() => openCollectionModal()} className="px-6 py-2 bg-primary/10 text-primary font-medium rounded-xl hover:bg-primary/20 transition-colors">
                 Create Collection
               </button>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {collections.map(col => (
                <div key={col.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group">
                  <div 
                    className="h-40 bg-gray-50 relative flex items-center justify-center border-b border-gray-100 p-4"
                    onClick={() => setSelectedCollection(col)}
                  >
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
                    {col.thumbnail_url ? (
                      <img src={col.thumbnail_url} alt={col.name} className="max-w-full max-h-full object-contain relative z-10" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300 relative z-10" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-20" />
                  </div>
                  <div className="p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-text truncate flex-1" title={col.name}>{col.name}</h3>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openCollectionModal(col); }} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-md"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {col.description && <p className="text-xs text-gray-500 truncate mb-2">{col.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // Assets View
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedCollection(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-poppins font-bold text-text flex items-center gap-3">
                  {selectedCollection.name}
                  <button onClick={() => openCollectionModal(selectedCollection)} className="text-gray-400 hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                </h1>
                <p className="text-sm text-gray-500">{assets.length} items in collection</p>
              </div>
            </div>
            
            <div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/svg+xml, image/webp" onChange={handleFileSelect} />
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 justify-center w-full sm:w-auto">
                <UploadCloud className="w-4 h-4" /> Upload Asset
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search assets..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select className="pl-9 pr-8 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-sm appearance-none bg-white w-full sm:w-auto min-w-[160px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {Array.from(new Set(assets.map(a => a.category))).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : filteredAssets.length === 0 ? (
             <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-lg mx-auto">
               <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-text">{searchTerm || categoryFilter ? 'No matching assets' : 'Collection is Empty'}</h3>
               <p className="text-gray-500 mb-6">{searchTerm || categoryFilter ? 'Try adjusting your filters.' : 'Upload transparent PNGs, SVGs, or WebP files.'}</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredAssets.map(asset => (
                <div key={asset.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
                  <div className="h-32 bg-gray-50 relative flex items-center justify-center p-4 border-b border-gray-50">
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
                    {asset.thumbnail_url || asset.image_url ? (
                      <img src={asset.thumbnail_url || asset.image_url!} alt={asset.name} className="max-w-full max-h-full object-contain relative z-10" />
                    ) : null}
                    <button onClick={() => handleDeleteAsset(asset)} className="absolute top-2 right-2 p-1.5 bg-white/95 text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs font-medium text-text truncate mb-1" title={asset.name}>{asset.name}</p>
                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[70%]">{asset.category}</span>
                      <span>{Math.round((asset.file_size || 0)/1024)}KB</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Collection Modal */}
      {collectionModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-poppins font-bold text-text">{collectionModal.collection ? 'Edit Collection' : 'New Collection'}</h2>
              <button onClick={() => setCollectionModal({ isOpen: false })} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Collection Name *</label>
                <input type="text" value={colName} onChange={e => setColName(e.target.value)} placeholder="e.g. Vintage Florals" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea value={colDesc} onChange={e => setColDesc(e.target.value)} rows={3} placeholder="Describe this asset collection..." className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button onClick={() => setCollectionModal({ isOpen: false })} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200/50 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSaveCollection} disabled={!colName.trim()} className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-poppins font-bold text-text">Upload Asset</h2>
              <button onClick={() => !uploading && setUploadModal({ isOpen: false, file: null, error: null })} disabled={uploading} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors disabled:opacity-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {uploadModal.error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Upload Error</p>
                    <p className="text-sm mt-1">{uploadModal.error}</p>
                  </div>
                </div>
              ) : uploadModal.file && (
                <>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                     <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center relative overflow-hidden shrink-0">
                       <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' }}></div>
                       <ImageIcon className="w-6 h-6 text-gray-400 relative z-10" />
                     </div>
                     <div className="min-w-0 flex-1">
                       <p className="font-medium text-sm text-gray-900 truncate">{uploadModal.file.name}</p>
                       <p className="text-xs text-gray-500">{Math.round(uploadModal.file.size / 1024)} KB</p>
                     </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Category *</label>
                    <select 
                      value={assetCategory} 
                      onChange={e => setAssetCategory(e.target.value)}
                      disabled={uploading}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white appearance-none mb-3"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>

                    {assetCategory === 'Custom' && (
                      <input 
                        type="text" 
                        value={customCategory} 
                        onChange={e => setCustomCategory(e.target.value)} 
                        disabled={uploading}
                        placeholder="Enter custom category..." 
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                      />
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button onClick={() => setUploadModal({ isOpen: false, file: null, error: null })} disabled={uploading} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200/50 rounded-xl transition-colors disabled:opacity-50">
                {uploadModal.error ? 'Close' : 'Cancel'}
              </button>
              {!uploadModal.error && (
                <button 
                  onClick={handleUploadAsset} 
                  disabled={uploading || (assetCategory === 'Custom' && !customCategory.trim())} 
                  className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <UploadCloud className="w-4 h-4" />}
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
