'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Calendar, MapPin, Type, AlignLeft, DollarSign,
    ArrowLeft, CheckCircle, Loader, Layers, Clock
} from 'lucide-react';

export default function CreateEvent() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        category_id: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchCategories();
    }, [router]);

    const fetchCategories = async () => {
        try {
            const cRes = await fetch('/api/categories');
            if (cRes.ok) setCategories(await cRes.json());
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    organizer_id: user.id || user.userId || (user as any).insertId
                })
            });

            if (!res.ok) throw new Error('Failed to create event');

            router.push('/dashboard');
        } catch (error) {
            alert('Error creating event');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white font-sans selection:bg-cyan-500/30 pb-20">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-cyan-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto p-6 lg:p-10">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>

                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/20">
                            ✨
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-white">Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Event</span></h1>
                            <p className="text-gray-400 mt-1">Design an unforgettable experience.</p>
                        </div>
                    </div>
                </motion.header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Event Details Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Info Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-1 space-y-6"
                        >
                            <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6">
                                <h3 className="text-lg font-bold text-white mb-2">Event Basics</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Provide the core details of your event. A catchy title and clear description help attract more attendees.
                                </p>
                            </div>

                            <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6">
                                <h3 className="text-lg font-bold text-white mb-2">Timing & Location</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Ensure the dates are correct. Choose a venue from our list or specify a custom location.
                                </p>
                            </div>
                        </motion.div>

                        {/* Right Form Inputs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-2 space-y-6"
                        >
                            <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-8 space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event Title</label>
                                    <div className="relative group">
                                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                                            placeholder="e.g. Summer Music Festival 2024"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                    <div className="relative group">
                                        <AlignLeft className="absolute left-4 top-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                        <textarea
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium min-h-[120px] resize-none"
                                            placeholder="Tell potential attendees what to expect..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Start Time */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Start Time</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                            <input
                                                type="datetime-local"
                                                required
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium custom-date-input"
                                                value={formData.start_time}
                                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* End Time */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">End Time</label>
                                        <div className="relative group">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                            <input
                                                type="datetime-local"
                                                required
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium custom-date-input"
                                                value={formData.end_time}
                                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Venue */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Venue Name</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Dhaka Expo Center"
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                                        <div className="relative group">
                                            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                            <select
                                                className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium appearance-none"
                                                value={formData.category_id}
                                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                            >
                                                <option value="" className="bg-[#0B0F1A]">Select Category</option>
                                                {categories.map((c: any) => (
                                                    <option key={c.category_id} value={c.category_id} className="bg-[#0B0F1A]">{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>



                    {/* Submit Action */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="pt-6"
                    >
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-6 h-6 animate-spin" />
                                    Creating Event...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-6 h-6" />
                                    Publish Event
                                </>
                            )}
                        </button>
                    </motion.div>
                </form>
            </div>
        </div>
    );
}
