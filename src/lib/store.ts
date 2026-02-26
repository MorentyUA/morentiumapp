import { type Category, type Item, defaultCategories, defaultItems } from '../types';

export async function getCategories(): Promise<Category[]> {
    try {
        const res = await fetch('/api/data');
        if (res.ok) {
            const data = await res.json();
            if (data.categories && data.categories.length > 0) {
                return data.categories;
            }
        }
    } catch (e) {
        console.error("Failed to fetch categories", e);
    }
    return defaultCategories;
}

export async function getItems(): Promise<Item[]> {
    try {
        const res = await fetch('/api/data');
        if (res.ok) {
            const data = await res.json();
            if (data.items && data.items.length > 0) {
                return data.items;
            }
        }
    } catch (e) {
        console.error("Failed to fetch items", e);
    }
    return defaultItems;
}

export async function saveCategories(categories: Category[]) {
    // In a real app we'd validate, but for now we just pass it to the backend.
    // We also need to send the items at the same time so we don't overwrite them with null, 
    // or we adjust the API to handle partial updates. 
    // For simplicity, we'll fetch current items first, then save both.
    const items = await getItems();
    await saveStoreData(categories, items);
}

export async function saveItems(items: Item[]) {
    const categories = await getCategories();
    await saveStoreData(categories, items);
}

// Function to save both simultaneously to edge config via our API
export async function saveStoreData(categories: Category[], items: Item[]) {
    try {
        const res = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                categories,
                items,
                // In a production app, pass the admin ID or a secure token here
                adminId: 'secure-token'
            })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error?.error?.message || data.error?.message || JSON.stringify(data.error) || 'Unknown save error');
        }
    } catch (e: any) {
        console.error("Failed to save data explicitly", e);
        throw e; // Bubble up for the UI to catch
    }
}
