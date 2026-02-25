import { type Category, type Item, defaultCategories, defaultItems } from '../types';

const CATEGORIES_KEY = 'twa_categories';
const ITEMS_KEY = 'twa_items';

export function getCategories(): Category[] {
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (data) {
        return JSON.parse(data);
    }
    // Initialize with defaults if empty
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
    return defaultCategories;
}

export function saveCategories(categories: Category[]) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function getItems(): Item[] {
    const data = localStorage.getItem(ITEMS_KEY);
    if (data) {
        return JSON.parse(data);
    }
    // Initialize with defaults if empty
    localStorage.setItem(ITEMS_KEY, JSON.stringify(defaultItems));
    return defaultItems;
}

export function saveItems(items: Item[]) {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export function getItemsByCategory(categoryId: string): Item[] {
    const items = getItems();
    return items.filter(item => item.categoryId === categoryId);
}
