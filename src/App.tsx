import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ContentView } from './components/ContentView';
import { AdminPanel } from './components/AdminPanel';
import { SubscriptionGate } from './components/SubscriptionGate';
import { YoutubeTracker } from './components/YoutubeTracker';
import { BottomNav } from './components/BottomNav';
import { Profile } from './components/Profile';
import { YoutubeSpy } from './components/YoutubeSpy';
import { getCategories, getItems } from './lib/store';
import { type Category, type Item, ADMIN_ID } from './types';
import { useTelegram } from './hooks/useTelegram';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tools' | 'profile'>('dashboard');
  const [activeTool, setActiveTool] = useState<'tracker' | 'spy' | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isPublicSubscribed, setIsPublicSubscribed] = useState<boolean | null>(null);
  const [isPrivateSubscribed, setIsPrivateSubscribed] = useState<boolean>(false);
  const [isCheckingSub, setIsCheckingSub] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [subError, setSubError] = useState<string>('');

  // Use Telegram hooks
  const { user, tg } = useTelegram();

  const loadData = async (newCategories?: Category[], newItems?: Item[]) => {
    if (newCategories && newItems) {
      // Direct state update from save bypassing the GET fetch cache
      setCategories(newCategories);
      setItems(newItems);
      return;
    }

    setIsDataLoading(true);
    const fetchedCategories = await getCategories();
    const fetchedItems = await getItems();
    setCategories(fetchedCategories);
    setItems(fetchedItems);
    setIsDataLoading(false);
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

  const checkSubscription = async () => {
    setIsCheckingSub(true);
    setSubError(''); // clear prev errors
    if (!user?.id) {
      // For testing outside telegram, allow access
      setIsPublicSubscribed(true);
      setIsPrivateSubscribed(true); // Allow all locally
      setIsCheckingSub(false);
      return;
    }

    try {
      const res = await fetch(`/api/check-subscription?userId=${user.id}`);
      const data = await res.json();

      // If API returned isPublicSubscribed: false, block them. Otherwise allow.
      setIsPublicSubscribed(data.isPublicSubscribed !== false);
      setIsPrivateSubscribed(data.isPrivateSubscribed === true);

      if (data.error || data.debug?.public || data.debug?.private) {
        setSubError(data.error || JSON.stringify(data.debug));
      }
    } catch (e) {
      // On network error fallback to allow so we don't lock out users completely
      setIsPublicSubscribed(true);
      setIsPrivateSubscribed(false);
    } finally {
      setIsCheckingSub(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user?.id]);

  // Check if current user is admin (or fallback to true for local testing if no user is detected)
  // For production, fallback to false.
  const isAdmin = user?.id === ADMIN_ID || !user;

  const categoryItems = selectedCategory ? items.filter(i => i.categoryId === selectedCategory.id) : [];

  if (isCheckingSub || isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isPublicSubscribed === false && !isAdmin) {
    // Admins are never blocked by the subscription gate
    return <SubscriptionGate onRetry={checkSubscription} error={subError} />;
  }

  const showVIPPopup = () => {
    try {
      tg.showPopup({
        title: '⭐️ VIP Контент',
        message: 'Для доступу потрібна VIP підписка на нашу приватну групу!',
        buttons: [
          { id: 'subscribe', type: 'default', text: 'Долучитися' },
          { id: 'cancel', type: 'cancel' }
        ]
      }, (buttonId?: string) => {
        if (buttonId === 'subscribe') {
          tg.openTelegramLink(import.meta.env.VITE_INVITE_LINK || "https://t.me/morentube/183");
        }
      });
    } catch (e) {
      alert('Для доступу потрібна VIP підписка!');
    }
  };

  return (
    <div className="min-h-screen font-sans antialiased text-white transition-colors duration-300">
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' ? (
          !selectedCategory ? (
            <Dashboard
              key="dashboard"
              categories={categories}
              isPrivateSubscribed={isAdmin || import.meta.env.DEV || isPrivateSubscribed}
              onSelectCategory={(cat) => {
                if (cat.isPrivate && !isAdmin && !import.meta.env.DEV && !isPrivateSubscribed) {
                  showVIPPopup();
                  return;
                }
                setSelectedCategory(cat);
              }}
            />
          ) : (
            <ContentView
              key="content"
              category={selectedCategory}
              items={categoryItems}
              onBack={() => setSelectedCategory(null)}
            />
          )
        ) : activeTab === 'tools' ? (
          activeTool === 'tracker' ? (
            <div className="relative">
              <button onClick={() => setActiveTool(null)} className="absolute top-6 left-4 z-50 p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <YoutubeTracker key="tracker" />
            </div>
          ) : activeTool === 'spy' ? (
            <div className="relative">
              <button onClick={() => setActiveTool(null)} className="absolute top-6 left-4 z-50 p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <YoutubeSpy key="spy" />
            </div>
          ) : (
            <motion.div key="tools-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 mb-24 min-h-screen">
              <div className="mb-8 pt-4">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 mb-2 drop-shadow-md tracking-tight">
                  Інструменти
                </h1>
                <p className="text-slate-400 text-sm">Корисні утиліти для аналізу та трекінгу.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div
                  onClick={() => setActiveTool('tracker')}
                  className="glass-card p-5 cursor-pointer relative overflow-hidden group hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">YouTube Tracker</h3>
                      <p className="text-sm text-slate-400">Графік публікацій відео та статистика каналу.</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    if (!isAdmin && !import.meta.env.DEV && !isPrivateSubscribed) {
                      showVIPPopup();
                      return;
                    }
                    setActiveTool('spy');
                  }}
                  className="glass-card p-5 cursor-pointer relative overflow-hidden group hover:bg-white/5 transition-colors border-amber-500/30"
                >
                  {/* VIP Badge */}
                  <div className="absolute top-0 right-0 bg-amber-500/20 px-3 py-1 rounded-bl-xl border-b border-l border-amber-500/30 text-[10px] font-black tracking-wider uppercase text-amber-400 flex items-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>
                    VIP
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-50 mb-1">YouTube SEO Шпигун</h3>
                      <p className="text-sm text-slate-400">Аналіз прихованих тегів та реального залучення відео.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        ) : (
          <Profile
            key="profile"
            isPublicSubscribed={isPublicSubscribed}
            isPrivateSubscribed={isPrivateSubscribed}
            isAdmin={isAdmin}
            items={items}
          />
        )}
      </AnimatePresence>

      {!selectedCategory && (
        <BottomNav
          activeTab={activeTab}
          onChange={(tab) => {
            if (tab !== 'tools') setActiveTool(null);
            setActiveTab(tab);
          }}
        />
      )}

      {(isAdmin || import.meta.env.DEV) && (
        <AdminPanel
          categories={categories}
          items={items}
          onDataChange={loadData}
        />
      )}
    </div >
  );
}

export default App;
