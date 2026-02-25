import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ContentView } from './components/ContentView';
import { AdminPanel } from './components/AdminPanel';
import { SubscriptionGate } from './components/SubscriptionGate';
import { getCategories, getItems } from './lib/store';
import { type Category, type Item, ADMIN_ID } from './types';
import { useTelegram } from './hooks/useTelegram';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isCheckingSub, setIsCheckingSub] = useState(true);

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

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id) {
        // For testing outside telegram, allow access
        setIsSubscribed(true);
        setIsCheckingSub(false);
        return;
      }

      try {
        const res = await fetch(`/api/check-subscription?userId=${user.id}`);
        const data = await res.json();

        // If API returned isSubscribed: false, block them. Otherwise allow.
        setIsSubscribed(data.isSubscribed !== false);
      } catch (e) {
        // On network error fallback to allow so we don't lock out users completely
        setIsSubscribed(true);
      } finally {
        setIsCheckingSub(false);
      }
    };

    checkSubscription();
  }, [user?.id]);

  // Check if current user is admin (or fallback to true for local testing if no user is detected)
  // For production, fallback to false.
  const isAdmin = user?.id === ADMIN_ID || !user;

  const categoryItems = selectedCategory ? items.filter(i => i.categoryId === selectedCategory.id) : [];

  if (isCheckingSub) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isSubscribed === false && !isAdmin) {
    // Admins are never blocked by the subscription gate
    return <SubscriptionGate />;
  }

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
