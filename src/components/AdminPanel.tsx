import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Settings, Lock } from 'lucide-react';
import { type Category, type Item, type ItemType } from '../types';
import { saveCategories, saveItems } from '../lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';

interface AdminPanelProps {
    categories: Category[];
    items: Item[];
    onDataChange: (newCategories?: Category[], newItems?: Item[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ categories, items, onDataChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');
    const { HapticFeedback } = useTelegram();

    // Category Form
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [catTitle, setCatTitle] = useState('');
    const [catDesc, setCatDesc] = useState('');
    const [catImg, setCatImg] = useState('');
    const [catIsPrivate, setCatIsPrivate] = useState(false);

    // Item Form
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [itemCatId, setItemCatId] = useState(categories.length > 0 ? categories[0].id : '');
    const [itemType, setItemType] = useState<ItemType>('link');
    const [itemTitle, setItemTitle] = useState('');
    const [itemContent, setItemContent] = useState('');
    const [itemUrl, setItemUrl] = useState('');

    // Keep itemCatId in sync if categories are added/removed and currently empty
    useEffect(() => {
        if (!itemCatId && categories.length > 0) {
            setItemCatId(categories[0].id);
        }
    }, [categories]);

    const togglePanel = () => {
        try { HapticFeedback.impactOccurred('medium'); } catch (e) { }
        setIsOpen(!isOpen);
    };

    const handleAddOrEditCategory = async () => {
        if (!catTitle) { setSaveError("Title is required"); return; }
        if (isSaving) return;
        setIsSaving(true);
        setSaveError('');
        try {
            if (editingCategoryId) {
                // Edit existing
                const updatedCategories = categories.map(c =>
                    c.id === editingCategoryId
                        ? { ...c, title: catTitle, description: catDesc, coverImage: catImg, isPrivate: catIsPrivate }
                        : c
                );
                const newData = await saveCategories(updatedCategories);
                onDataChange(newData.categories, newData.items);
            } else {
                // Add new
                const newCat: Category = {
                    id: 'cat-' + Date.now(),
                    title: catTitle,
                    description: catDesc,
                    coverImage: catImg || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
                    isPrivate: catIsPrivate,
                };
                const newData = await saveCategories([...categories, newCat]);
                onDataChange(newData.categories, newData.items);
            }
            // Reset form
            setEditingCategoryId(null);
            setCatTitle(''); setCatDesc(''); setCatImg(''); setCatIsPrivate(false);
        } catch (e: any) {
            setSaveError(e.message || "Failed to save category");
        }
        setIsSaving(false);
    };

    const startEditCategory = (cat: Category) => {
        setEditingCategoryId(cat.id);
        setCatTitle(cat.title);
        setCatDesc(cat.description);
        setCatImg(cat.coverImage);
        setCatIsPrivate(cat.isPrivate || false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditCategory = () => {
        setEditingCategoryId(null);
        setCatTitle(''); setCatDesc(''); setCatImg(''); setCatIsPrivate(false);
    };

    const handleDeleteCategory = async (id: string) => {
        if (isSaving) return;
        setIsSaving(true);
        setSaveError('');
        try {
            await saveCategories(categories.filter(c => c.id !== id));
            const newData = await saveItems(items.filter(i => i.categoryId !== id));
            onDataChange(newData.categories, newData.items);
        } catch (e: any) {
            setSaveError(e.message || "Failed to delete category");
        }
        setIsSaving(false);
    };

    const handleAddOrEditItem = async () => {
        if (!itemTitle) { setSaveError("Title is required"); return; }
        if (!itemCatId) { setSaveError("Please create a category first"); return; }
        if (isSaving) return;

        setIsSaving(true);
        setSaveError('');
        try {
            if (editingItemId) {
                // Edit existing
                const updatedItems = items.map(i =>
                    i.id === editingItemId
                        ? { ...i, categoryId: itemCatId, type: itemType, title: itemTitle, content: itemContent, url: itemUrl }
                        : i
                );
                const newData = await saveItems(updatedItems);
                onDataChange(newData.categories, newData.items);
            } else {
                // Add new
                const newItem: Item = {
                    id: 'item-' + Date.now(),
                    categoryId: itemCatId,
                    type: itemType,
                    title: itemTitle,
                    content: itemContent,
                    url: itemUrl,
                };
                const newData = await saveItems([...items, newItem]);
                onDataChange(newData.categories, newData.items);
            }
            // Reset form
            setEditingItemId(null);
            setItemTitle(''); setItemContent(''); setItemUrl('');
        } catch (e: any) {
            setSaveError(e.message || "Failed to save item");
        }
        setIsSaving(false);
    };

    const startEditItem = (item: Item) => {
        setEditingItemId(item.id);
        setItemCatId(item.categoryId);
        setItemType(item.type);
        setItemTitle(item.title);
        setItemContent(item.content);
        setItemUrl(item.url || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditItem = () => {
        setEditingItemId(null);
        setItemTitle(''); setItemContent(''); setItemUrl('');
    };

    const handleDeleteItem = async (id: string) => {
        if (isSaving) return;
        setIsSaving(true);
        setSaveError('');
        try {
            const newData = await saveItems(items.filter(i => i.id !== id));
            onDataChange(newData.categories, newData.items);
        } catch (e: any) {
            setSaveError(e.message || "Failed to delete item");
        }
        setIsSaving(false);
    };

    return (
        <>
            <button
                onClick={togglePanel}
                className="fixed bottom-24 sm:bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 transition-colors z-[60] flex items-center justify-center"
            >
                <Settings className="w-6 h-6" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-50 bg-[#0f172a] overflow-y-auto"
                    >
                        <div className="p-4 sm:p-6 pb-48 max-w-2xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
                                <button onClick={togglePanel} className="p-2 bg-white/10 rounded-full text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex space-x-2 mb-6 bg-white/5 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('categories')}
                                    className={`flex-1 py-2 rounded-md transition-colors ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Categories
                                </button>
                                <button
                                    onClick={() => setActiveTab('items')}
                                    className={`flex-1 py-2 rounded-md transition-colors ${activeTab === 'items' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Items
                                </button>
                            </div>

                            {saveError && (
                                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                                    <p className="font-bold">Помилка збереження (Error saving to server):</p>
                                    <p className="break-all">{saveError}</p>
                                </div>
                            )}

                            {activeTab === 'categories' && (
                                <div className="space-y-6">
                                    <div className="glass-card p-4 space-y-4">
                                        <h3 className="font-bold text-white">{editingCategoryId ? 'Edit Category' : 'Add New Category'}</h3>
                                        <input type="text" placeholder="Title" value={catTitle} onChange={e => setCatTitle(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                                        <input type="text" placeholder="Description" value={catDesc} onChange={e => setCatDesc(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                                        <input type="text" placeholder="Image URL (optional)" value={catImg} onChange={e => setCatImg(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />

                                        <label className="flex items-center space-x-3 text-white cursor-pointer bg-black/30 p-3 rounded-lg border border-white/10">
                                            <input type="checkbox" checked={catIsPrivate} onChange={e => setCatIsPrivate(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700" />
                                            <span>Make Private (Premium Only)</span>
                                        </label>

                                        <div className="flex space-x-2">
                                            {editingCategoryId && (
                                                <button onClick={cancelEditCategory} disabled={isSaving} className="w-1/3 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center">
                                                    Cancel
                                                </button>
                                            )}
                                            <button onClick={handleAddOrEditCategory} disabled={isSaving} className={`flex-1 ${isSaving ? 'bg-emerald-800 text-emerald-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'} font-bold py-3 rounded-lg transition-colors flex items-center justify-center`}>
                                                {editingCategoryId ? (isSaving ? "Saving..." : "Save Changes") : <><Plus className="w-5 h-5 mr-2" /> {isSaving ? "Saving..." : "Add Category"}</>}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-bold text-slate-300 px-1">Existing Categories</h3>
                                        {categories.map(cat => (
                                            <div key={cat.id} className="glass-card p-4 flex justify-between items-center bg-white/5">
                                                <div>
                                                    <p className="font-bold text-white flex items-center">
                                                        {cat.isPrivate && <Lock className="w-4 h-4 mr-2 text-yellow-500" />}
                                                        {cat.title}
                                                    </p>
                                                    <p className="text-sm text-slate-400">{cat.id}</p>
                                                </div>
                                                <div className="flex space-x-1 shrink-0">
                                                    <button onClick={() => startEditCategory(cat)} className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors">
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'items' && (
                                <div className="space-y-6">
                                    <div className="glass-card p-4 space-y-4">
                                        <h3 className="font-bold text-white">{editingItemId ? 'Edit Item' : 'Add New Item'}</h3>

                                        <select value={itemCatId} onChange={e => setItemCatId(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500">
                                            {categories.map(c => <option key={c.id} value={c.id} className="bg-slate-800">{c.title}</option>)}
                                        </select>

                                        <select value={itemType} onChange={e => setItemType(e.target.value as ItemType)} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500">
                                            <option value="link" className="bg-slate-800">External Link</option>
                                            <option value="youtube" className="bg-slate-800">YouTube Video</option>
                                            <option value="text" className="bg-slate-800">Text Block</option>
                                        </select>

                                        <input type="text" placeholder="Title" value={itemTitle} onChange={e => setItemTitle(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                                        <textarea placeholder={itemType === 'text' ? "Full content" : "Short description"} value={itemContent} onChange={e => setItemContent(e.target.value)} rows={3} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />

                                        {itemType !== 'text' && (
                                            <input type="text" placeholder="URL Target" value={itemUrl} onChange={e => setItemUrl(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                                        )}

                                        <div className="flex space-x-2">
                                            {editingItemId && (
                                                <button onClick={cancelEditItem} disabled={isSaving} className="w-1/3 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center">
                                                    Cancel
                                                </button>
                                            )}
                                            <button onClick={handleAddOrEditItem} disabled={isSaving} className={`flex-1 ${isSaving ? 'bg-emerald-800 text-emerald-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'} font-bold py-3 rounded-lg transition-colors flex items-center justify-center`}>
                                                {editingItemId ? (isSaving ? "Saving..." : "Save Changes") : <><Plus className="w-5 h-5 mr-2" /> {isSaving ? "Saving..." : "Add Item"}</>}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-bold text-slate-300 px-1">Existing Items</h3>
                                        {items.map(item => (
                                            <div key={item.id} className="glass-card p-4 flex justify-between items-center bg-white/5">
                                                <div className="min-w-0 pr-4">
                                                    <p className="font-bold text-white truncate">{item.title}</p>
                                                    <p className="text-xs text-blue-400 capitalize">{item.type} • {categories.find(c => c.id === item.categoryId)?.title}</p>
                                                </div>
                                                <div className="flex space-x-1 shrink-0">
                                                    <button onClick={() => startEditItem(item)} className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors">
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors shrink-0">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
