import { type Category, type Item } from '../types';
import localData from '../data.json';

export async function getCategories(): Promise<Category[]> {
    return localData.categories as Category[];
}

export async function getItems(): Promise<Item[]> {
    return localData.items as Item[];
}

export async function saveCategories(categories: Category[]): Promise<{ categories: Category[], items: Item[] }> {
    const items = await getItems();
    return await saveStoreData(categories, items);
}

export async function saveItems(items: Item[]): Promise<{ categories: Category[], items: Item[] }> {
    const categories = await getCategories();
    return await saveStoreData(categories, items);
}

export async function saveStoreData(categories: Category[], items: Item[]): Promise<{ categories: Category[], items: Item[] }> {
    try {
        // If DEV mode, it saves locally to your PC via Vite's middleware
        // If PROD mode (Vercel), it saves to GitHub via Serverless function
        const endpoint = import.meta.env.DEV ? '/api/save-data' : '/api/github-save';

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ categories, items })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Failed to save data remotely.');
        }

        // Vite will hot-reload locally. On vercel, the GitHub push will trigger a rebuild.
        // Return the modified reference.
    } catch (e: any) {
        console.error("Save Error:", e);
        throw e;
    }

    return { categories, items };
}
