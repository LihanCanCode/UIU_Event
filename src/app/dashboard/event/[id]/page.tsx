'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Clock, User, Share2, Trash2, Edit2, CheckCircle, 
    XCircle, Ticket, Image as ImageIcon, Briefcase, Plus, Loader, ArrowLeft
} from 'lucide-react';

export default function EventDetails() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [user, setUser] = useState<any>(null);
    const [event, setEvent] = useState<any>(null);
    const [ticketTypes, setTicketTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Ticket Creation State
    const [newTicket, setNewTicket] = useState({ name: '', price: '', quantity: '' });
    const [ticketSubmitting, setTicketSubmitting] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        title: '', description: '', start_time: '', end_time: '', venue_id: '', category_id: ''
    });
    const [venues, setVenues] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);



    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
        if (id) fetchData(id as string);
    }, [id, router]);

    useEffect(() => {
        if (isEditing && venues.length === 0) {
            Promise.all([
                fetch('/api/venues').then(r => r.json()),
                fetch('/api/categories').then(r => r.json())
            ]).then(([v, c]) => {
                setVenues(v);
                setCategories(c);
            });
        }
    }, [isEditing]);

    useEffect(() => {
        if (event) {
            setEditFormData({
                title: event.title,
                description: event.description || '',
                start_time: new Date(event.start_time).toISOString().slice(0, 16),
                end_time: new Date(event.end_time).toISOString().slice(0, 16),
                venue_id: event.venue_id || '',
                category_id: event.category_id || ''
            });
        }
    }, [event]);

    const fetchData = async (eventId: string) => {
        try {
            const [eventRes, ticketsRes] = await Promise.all([
                fetch(`/api/events/${eventId}`),
                fetch(`/api/ticket-types?event_id=${eventId}`)
            ]);

            if (eventRes.ok) setEvent(await eventRes.json());
            if (ticketsRes.ok) setTicketTypes(await ticketsRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEvent = async () => {
        try {
            const res = await fetch(`/api/events/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData)
            });
            if (res.ok) {
                alert('Event updated successfully');
                setIsEditing(false);
                fetchData(id as string);
            } else {
                alert('Update failed');
            }
        } catch (err) { alert('Error updating event'); }
    };

    const handleAddTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setTicketSubmitting(true);
        try {
            const res = await fetch('/api/ticket-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_id: id,
                    name: newTicket.name,
                    price: parseFloat(newTicket.price),
                    quantity: parseInt(newTicket.quantity)
                })
            });
            if (res.ok) {
                setNewTicket({ name: '', price: '', quantity: '' });
                fetchData(id as string);
            }
        } catch (error) { console.error(error); } finally { setTicketSubmitting(false); }
    };



    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
                <Loader className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (!event) return null;

    const isOrganizer = user.id === event.organizer_id;

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white font-sans selection:bg-cyan-500/30 pb-20">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] bg-cyan-900/05 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] right-[20%] w-[40vw] h-[40vw] bg-purple-900/05 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-10">

                {/* Header Back Link */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>
                </motion.div>

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#161B2B] border border-white/5 rounded-3xl p-8 mb-8 relative overflow-hidden"
                >
                    {/* Decorative Gradient */}
                    <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-cyan-900/10 to-transparent pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8">
                        <div className="flex-1 space-y-6">
                            {isEditing ? (
                                <div className="space-y-4 max-w-xl">
                                    <input
                                        className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:border-cyan-500/50 outline-none"
                                        value={editFormData.title}
                                        onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                                        placeholder="Event Title"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none custom-date-input"
                                            value={editFormData.start_time}
                                            onChange={e => setEditFormData({ ...editFormData, start_time: e.target.value })}
                                        />
                                        <select
                                            className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none appearance-none"
                                            value={editFormData.venue_id}
                                            onChange={e => setEditFormData({ ...editFormData, venue_id: e.target.value })}
                                        >
                                            <option value="">Select Venue</option>
                                            {venues.map(v => <option key={v.venue_id} value={v.venue_id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${event.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                            {event.status}
                                        </span>
                                        {event.category_name && (
                                            <span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                                                {event.category_name}
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                                        {event.title}
                                    </h1>
                                    <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="text-cyan-400" size={18} />
                                            <span>
                                                {new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="text-cyan-400" size={18} />
                                            <span>
                                                {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {event.venue_name && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="text-cyan-400" size={18} />
                                                <span>{event.venue_name}, {event.venue_city}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <User className="text-cyan-400" size={18} />
                                            <span>Org. by {event.organizer_name}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Organizer Actions */}
                        {isOrganizer && (
                            <div className="flex flex-col items-end gap-4 min-w-[200px]">

                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isEditing ? <><XCircle size={16} /> Cancel</> : <><Edit2 size={16} /> Edit</>}
                                    </button>
                                    {isEditing && (
                                        <button
                                            onClick={handleUpdateEvent}
                                            className="flex-1 py-2.5 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16} /> Save
                                        </button>
                                    )}
                                </div>
                                {!isEditing && (
                                    <button
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to DELETE this event? This action cannot be undone.")) {
                                                await fetch(`/api/events/${id}`, { method: 'DELETE' });
                                                router.push('/dashboard');
                                            }
                                        }}
                                        className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} /> Delete Event
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (Main) */}
                    <div className="lg:col-span-2 space-y-8">



                        {/* About */}
                        <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-8">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Briefcase size={20} /></span>
                                About Event
                            </h3>
                            {isEditing ? (
                                <textarea
                                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl p-4 text-white min-h-[200px] focus:outline-none focus:border-cyan-500/50"
                                    value={editFormData.description}
                                    onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                />
                            ) : (
                                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {event.description || 'No description provided.'}
                                </p>
                            )}
                        </div>


                        {/* Ticket Types Display */}
                        <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-8">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="p-2 rounded-lg bg-pink-500/10 text-pink-500"><Ticket size={20} /></span>
                                Ticket Packages
                            </h3>
                            {ticketTypes.length === 0 ? (
                                <div className="text-center py-8 bg-[#0B0F1A] rounded-xl border border-white/5 border-dashed">
                                    <p className="text-gray-500 text-sm">No tickets available yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {ticketTypes.map((t) => (
                                        <div key={t.ticket_type_id} className="flex justify-between items-center p-4 rounded-xl bg-[#0B0F1A] border border-white/5">
                                            <div>
                                                <p className="font-bold text-white">{t.name}</p>
                                                <p className="text-xs text-gray-500">{t.quantity} available</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-cyan-400">৳{Number(t.price).toFixed(0)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        {/* Add Ticket Module */}
                        <div className="bg-[#161B2B] border border-white/5 rounded-3xl p-6">
                            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Plus size={16} className="text-cyan-500" /> Add Ticket Type
                            </h4>
                            <form onSubmit={handleAddTicket} className="space-y-4">
                                <input
                                    className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none"
                                    placeholder="Ticket Name"
                                    value={newTicket.name}
                                    onChange={e => setNewTicket({ ...newTicket, name: e.target.value })}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none"
                                        placeholder="Price"
                                        value={newTicket.price}
                                        onChange={e => setNewTicket({ ...newTicket, price: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="number"
                                        className="w-full bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none"
                                        placeholder="Qty"
                                        value={newTicket.quantity}
                                        onChange={e => setNewTicket({ ...newTicket, quantity: e.target.value })}
                                        required
                                    />
                                </div>
                                <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm transition-colors">
                                    {ticketSubmitting ? 'Adding...' : 'Add Ticket'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


