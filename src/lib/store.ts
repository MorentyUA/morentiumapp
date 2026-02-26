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

export async function saveCategories(categories: Category[]): Promise<{ categories: Category[], items: Item[] }> {
    const items = await getItems();
    return await saveStoreData(categories, items);
}

export async function saveItems(items: Item[]): Promise<{ categories: Category[], items: Item[] }> {
    const categories = await getCategories();
    return await saveStoreData(categories, items);
}

// Function to save both simultaneously to edge config via our API
export async function saveStoreData(categories: Category[], items: Item[]): Promise<{ categories: Category[], items: Item[] }> {
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

        // Return the successfully saved payload so the UI can update immediately
        // bypassing the Edge Config geographical propagation delay (usually ~1-5s).
        return { categories, items };
    } catch (e: any) {
        console.error("Failed to save data explicitly", e);
        throw e; // Bubble up for the UI to catch
    }
}
