'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    User, Ticket, Bell, Calendar, Plus, LayoutDashboard,
    Search, MapPin, Clock, ChevronRight, ChevronDown, LogOut, ArrowUpRight
} from 'lucide-react';


export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ organizedCount: 0 });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [router]);

    useEffect(() => {
        if (user) {
            fetchEvents();
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        const userId = user.id || user.userId || (user as any).insertId;
        if (!userId) return;
        try {
            const res = await fetch(`/api/user/stats?user_id=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (user) fetchEvents();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/events?search=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                const data = await res.json();
                const upcomingEvents = data.filter((e: any) => new Date(e.end_time) > new Date());
                setEvents(upcomingEvents);
            }
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setIsLoading(false);
        }
    };



    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!user) return null;

    const uniqueCategories = ['All', ...Array.from(new Set(events.map(e => e.category_name).filter(Boolean)))];
    const filteredEvents = activeCategory === 'All' ? events : events.filter(e => e.category_name === activeCategory);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-cyan-500/30">
            {/* Ambient Background - Subtle on dashboard to not distract */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[40vw] h-[40vw] bg-cyan-900/05 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[10%] w-[40vw] h-[40vw] bg-purple-900/05 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-10 space-y-10">

                {/* Header Section */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                >
                    <div className="flex items-center gap-6">
                        <Link href="/" className="group flex items-center gap-2">
                            <div className="relative w-10 h-10">
                                <span className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-orange-400 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                                <div className="relative w-full h-full bg-background rounded-xl border border-white/10 flex items-center justify-center">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-orange-400 font-bold text-xl">E</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">Event<span className="text-cyan-400">Koi</span></h1>
                                <p className="text-xs text-gray-500 font-medium">Dashboard</p>
                            </div>
                        </Link>

                        <div className="hidden md:block h-8 w-px bg-white/5" />

                        <div className="hidden md:block">
                            <h2 className="text-white font-medium flex items-center gap-2">
                                Hello, {user.name}
                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${user.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                    user.role === 'organizer' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                        'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                                    }`}>
                                    {user.role}
                                </span>
                            </h2>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">


                        <div className="h-6 w-px bg-white/10 hidden sm:block" />

                        <Link href="/dashboard/create-event" className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2">
                            <Plus size={16} /> Create Event
                        </Link>





                        <button onClick={handleLogout} className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-foreground transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </motion.header>

                {/* Main Content Area: Sidebar + Events Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Highlighted Stats Column (Left) */}
                    <div className="lg:col-span-1">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-[#161B2B] border border-cyan-500/20 rounded-[2.5rem] p-8 flex flex-col justify-between group overflow-hidden relative sticky top-32 shadow-2xl shadow-cyan-500/5 hover:border-cyan-500/40 transition-all duration-500"
                        >
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-cyan-500/20 transition-all duration-700" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-[60px] -ml-12 -mb-12 group-hover:bg-blue-500/20 transition-all duration-700" />
                            
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/20 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                    <LayoutDashboard size={32} />
                                </div>
                                
                                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-[0.2em] mb-4">Focus</h3>
                                <div className="flex flex-col">
                                    <span className="text-7xl font-black text-white tracking-tighter mb-2 group-hover:text-cyan-400 transition-colors duration-500 leading-none">
                                        {stats.organizedCount}
                                    </span>
                                    <span className="text-lg font-bold text-gray-400">Total Events</span>
                                    <span className="text-xs text-cyan-500/60 font-medium mt-1">Successfully Managed</span>
                                </div>
                            </div>
                            
                            <div className="mt-12 pt-8 border-t border-white/5 relative z-10">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Active Status
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Events Grid (Right) */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Search & Filter */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#161B2B]/50 backdrop-blur-sm border border-white/5 rounded-[2rem] p-4">
                            <div className="relative w-full sm:max-w-md group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="relative group shrink-0">
                                <select
                                    value={activeCategory}
                                    onChange={(e) => setActiveCategory(e.target.value)}
                                    className="appearance-none bg-[#0B0F1A] border border-white/10 rounded-2xl py-3.5 pl-6 pr-14 text-white font-bold tracking-wider focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer text-xs uppercase"
                                >
                                    {uniqueCategories.map(cat => (
                                        <option key={cat as string} value={cat as string} className="bg-[#0B0F1A] text-white py-2">
                                            {cat === 'All' ? 'All Categories' : cat}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                                    <ChevronDown size={16} strokeWidth={3} />
                                </div>
                            </div>
                        </div>

                        {/* Events Section */}
                        <div>
                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-72 rounded-[2.5rem] bg-[#161B2B] animate-pulse border border-white/5" />
                                    ))}
                                </div>
                            ) : filteredEvents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center rounded-[2.5rem] bg-[#161B2B]/30 border border-white/5 border-dashed">
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        <Search className="text-gray-600" size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">No Events Found</h3>
                                    <p className="text-gray-500 max-w-xs">
                                        {activeCategory !== 'All' 
                                            ? `No active events found in the "${activeCategory}" category.` 
                                            : "You haven't added any events to your schedule yet."}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredEvents.map((event: any) => (
                                        <EventCard key={event.event_id} event={event} onClick={() => router.push(`/dashboard/event/${event.event_id}`)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Components

function NavButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </Link>
    );
}

function EventCard({ event, onClick }: { event: any; onClick: () => void }) {
    // Note: status badge removed for minimalist organizer experience

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={onClick}
            className="bg-[#161B2B]/80 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 cursor-pointer group hover:border-cyan-500/40 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(34,211,238,0.15)] relative overflow-hidden flex flex-col h-full"
        >
            {/* Ambient background glow on hover */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/0 rounded-full blur-[70px] -mr-10 -mt-10 group-hover:bg-cyan-500/15 transition-all duration-700 pointer-events-none" />

            <div className="flex justify-between items-start mb-6 relative z-10">
                {/* Visual Accent Icon */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-500">
                    <Calendar size={20} strokeWidth={2.5} />
                </div>

                <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 px-4 py-2 rounded-full border border-cyan-500/20 shadow-inner tracking-wide uppercase">
                    {event.category_name || 'Event'}
                </span>
            </div>

            <div className="flex-grow relative z-10">
                <h3 className="text-2xl font-black text-white mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight">
                    {event.title}
                </h3>
    
                <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                    {event.description || 'No description available'}
                </p>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5 relative z-10 mt-auto">
                <div className="flex items-center gap-3 text-sm text-gray-300 font-medium group-hover:text-white transition-colors">
                    <Clock size={18} className="text-cyan-500" />
                    <span>{new Date(event.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300 font-medium group-hover:text-white transition-colors">
                    <MapPin size={18} className="text-orange-400" />
                    <span className="line-clamp-1">{event.location || 'Online'}</span>
                </div>
            </div>
        </motion.div>
    );
}



// Add these custom styles to your global CSS for scrollbars if needed
// .custom-scrollbar::-webkit-scrollbar { width: 6px; }
// .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
// .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 99px; }
