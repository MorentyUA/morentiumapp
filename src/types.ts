export interface Category {
    id: string;
    title: string;
    description: string;
    coverImage: string;
}

export type ItemType = 'youtube' | 'link' | 'text';

export interface Item {
    id: string;
    categoryId: string;
    type: ItemType;
    title: string;
    content: string; // The text or description
    url?: string;    // URL for links or Youtube
    thumbnail?: string;
}

export const ADMIN_ID = 5987901450; // Set the Telegram User ID of the owner here

// Add your Categories here!
export const defaultCategories: Category[] = [
    // Example:
    // { id: 'cat-1', title: 'My First Category', description: 'Description here', coverImage: '' }
];

// Add your Items here!
export const defaultItems: Item[] = [
    // Example:
    // { id: 'item-1', categoryId: 'cat-1', type: 'youtube', title: 'My Video', content: 'Info', url: 'https://youtube...' }
];
