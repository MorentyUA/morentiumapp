import { type Category, type Item } from '../types';
import localData from './data.json';

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
    // Only allow saving when running locally in development mode!
    if (import.meta.env.DEV) {
        try {
            const res = await fetch('/api/save-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ categories, items })
            });

            if (!res.ok) {
                throw new Error('Failed to save data.json locally.');
            }

            // Vite will hot-reload the changes automatically since data.json changed!
        } catch (e: any) {
            console.error("Local save failed", e);
            throw e;
        }
    } else {
        throw new Error("Внимание! Вы находитесь на рабочем сервере Vercel. Админка работает только на вашем компьютере через 'npm run dev'. Внесите изменения локально и пушните на Github!");
    }

    return { categories, items };
}
