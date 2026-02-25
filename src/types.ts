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

// Default Data
export const defaultCategories: Category[] = [
    {
        id: 'cat-1',
        title: 'Featured Videos',
        description: 'Latest premium content and guides.',
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop'
    },
    {
        id: 'cat-2',
        title: 'Resources',
        description: 'Helpful tools and external links.',
        coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop'
    }
];

export const defaultItems: Item[] = [
    {
        id: 'item-1',
        categoryId: 'cat-1',
        type: 'youtube',
        title: 'How to Build a Telegram App',
        content: 'A comprehensive guide to building WebApps on Telegram.',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    },
    {
        id: 'item-2',
        categoryId: 'cat-2',
        type: 'link',
        title: 'Official Documentation',
        content: 'Read the official docs for more information.',
        url: 'https://core.telegram.org/bots/webapps'
    },
    {
        id: 'item-3',
        categoryId: 'cat-1',
        type: 'text',
        title: 'Welcome Note',
        content: 'Thank you for exploring our premium dark mode app! Feel free to browse through the categories.'
    }
];
