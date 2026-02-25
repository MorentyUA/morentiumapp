import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ContentView } from './components/ContentView';
import { AdminPanel } from './components/AdminPanel';
import { getCategories, getItems } from './lib/store';
import { type Category, type Item, ADMIN_ID } from './types';
import { useTelegram } from './hooks/useTelegram';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Use Telegram hooks
  const { user, tg } = useTelegram();

  const loadData = () => {
    setCategories(getCategories());
    setItems(getItems());
  };

  useEffect(() => {
    loadData();

    // Initialize WebApp
    try {
      tg.ready();
      tg.expand();
      // Apply telegram theme background if available
      document.body.style.backgroundColor = 'var(--tg-theme-bg-color, #0f172a)';
    } catch (e) {
      console.log('App is not running in pure Telegram environment');
    }
  }, [tg]);

  // Check if current user is admin (or fallback to true for local testing if no user is detected)
  // For production, fallback to false.
  const isAdmin = user?.id === ADMIN_ID || !user;

  const categoryItems = selectedCategory ? items.filter(i => i.categoryId === selectedCategory.id) : [];

  return (
    <div className="min-h-screen font-sans antialiased text-white transition-colors duration-300">
      <AnimatePresence mode="wait">
        {!selectedCategory ? (
          <Dashboard
            key="dashboard"
            categories={categories}
            onSelectCategory={setSelectedCategory}
          />
        ) : (
          <ContentView
            key="content"
            category={selectedCategory}
            items={categoryItems}
            onBack={() => setSelectedCategory(null)}
          />
        )}
      </AnimatePresence>

      {isAdmin && (
        <AdminPanel
          categories={categories}
          items={items}
          onDataChange={loadData}
        />
      )}
    </div>
  );
}

export default App;
