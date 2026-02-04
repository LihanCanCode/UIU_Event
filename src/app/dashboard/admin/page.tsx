'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Calendar, FileText, CheckCircle, XCircle,
    Shield, Search, AlertCircle, ArrowLeft, MoreHorizontal,
    TrendingUp, Activity, Lock
} from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({ users: 0, events: 0, pendingRequests: 0 });
    const [requests, setRequests] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('requests');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                router.push('/login');
                return;
            }
            const user = JSON.parse(storedUser);
            if (user.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
            fetchData();
        };
        checkAdmin();
    }, [router]);

    const fetchData = async () => {
        try {
            const [reqRes, usersRes, eventsRes] = await Promise.all([
                fetch('/api/admin/requests'),
                fetch('/api/users'),
                fetch('/api/events')
            ]);

            if (reqRes.ok) {
                const reqData = await reqRes.json();
                setRequests(reqData);
                setStats(s => ({ ...s, pendingRequests: reqData.length }));
            }
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData);
                setStats(s => ({ ...s, users: usersData.length }));
            }
            if (eventsRes.ok) {
                const eventsData = await eventsRes.json();
                setEvents(eventsData);
                setStats(s => ({ ...s, events: eventsData.length }));
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching admin data', error);
            setLoading(false);
        }
    };

    const handleRequestAction = async (requestId: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await fetch('/api/admin/requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_id: requestId, status })
            });
            if (res.ok) {
                fetchData();
            } else {
                alert('Action failed');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white selection:bg-cyan-500/30 font-sans pb-20">

            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-purple-900/10 blur-[120px]" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-cyan-900/10 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-10">
                {/* Header */}
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider mb-2"
                        >
                            <Shield size={12} /> Admin Access
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-black tracking-tight"
                        >
                            Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Center</span>
                        </motion.h1>
                    </div>

                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-[1.02] transition-all font-semibold"
                    >
                        <ArrowLeft size={18} /> Exit to Dashboard
                    </motion.button>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard
                        title="Pending Requests"
                        value={stats.pendingRequests}
                        icon={<FileText size={24} />}
                        color="orange"
                        index={0}
                    />
                    <StatCard
                        title="Total Users"
                        value={stats.users}
                        icon={<Users size={24} />}
                        color="cyan"
                        index={1}
                    />
                    <StatCard
                        title="Total Events"
                        value={stats.events}
                        icon={<Calendar size={24} />}
                        color="purple"
                        index={2}
                    />
                </div>

                {/* Main Control Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#161B2B]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl"
                >
                    {/* Tabs */}
                    <div className="flex border-b border-white/5 p-2 overflow-x-auto">
                        <TabButton id="requests" label="Role Requests" icon={<Lock size={16} />} active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} />
                        <TabButton id="users" label="All Users" icon={<Users size={16} />} active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                        <TabButton id="events" label="All Events" icon={<Activity size={16} />} active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
                    </div>

                    {/* Content Area */}
                    <div className="p-6 overflow-x-auto">
                        <AnimatePresence mode="wait">
                            {activeTab === 'requests' && (
                                <motion.div
                                    key="requests"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {requests.length === 0 ? (
                                        <EmptyState message="No pending role requests." />
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <Th>User</Th>
                                                <Th>Email</Th>
                                                <Th>Role Requested</Th>
                                                <Th align="right">Actions</Th>
                                            </TableHeader>
                                            <tbody>
                                                {requests.map((req, i) => (
                                                    <TableRow key={req.request_id} index={i}>
                                                        <Td className="font-medium text-white">{req.name}</Td>
                                                        <Td>{req.email}</Td>
                                                        <Td>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 capitalize border border-orange-500/20">
                                                                {req.requested_role}
                                                            </span>
                                                        </Td>
                                                        <Td align="right">
                                                            <div className="flex justify-end gap-2">
                                                                <ActionButton onClick={() => handleRequestAction(req.request_id, 'APPROVED')} variant="success">Approve</ActionButton>
                                                                <ActionButton onClick={() => handleRequestAction(req.request_id, 'REJECTED')} variant="danger">Reject</ActionButton>
                                                            </div>
                                                        </Td>
                                                    </TableRow>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'users' && (
                                <motion.div
                                    key="users"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Table>
                                        <TableHeader>
                                            <Th>User Details</Th>
                                            <Th>Role</Th>
                                            <Th>Status</Th>
                                            <Th align="right">Manage</Th>
                                        </TableHeader>
                                        <tbody>
                                            {users.map((u, i) => (
                                                <TableRow key={u.id} index={i}>
                                                    <Td>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white">{u.name}</span>
                                                            <span className="text-xs text-gray-500">{u.email}</span>
                                                        </div>
                                                    </Td>
                                                    <Td>
                                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                                                                u.role === 'organizer' ? 'bg-purple-500/10 text-purple-400' :
                                                                    'bg-gray-800 text-gray-400'
                                                            }`}>
                                                            {u.role}
                                                        </span>
                                                    </Td>
                                                    <Td>
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${u.is_verified ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-500 border border-white/5'
                                                            }`}>
                                                            {u.is_verified ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                                            {u.is_verified ? 'Verified' : 'Unverified'}
                                                        </span>
                                                    </Td>
                                                    <Td align="right">
                                                        <div className="flex justify-end">
                                                            {!u.is_verified ? (
                                                                <ActionButton
                                                                    onClick={async () => {
                                                                        if (confirm(`Verify ${u.name}?`)) {
                                                                            await fetch('/api/admin/verify-user', {
                                                                                method: 'PUT',
                                                                                body: JSON.stringify({ user_id: u.id, is_verified: true })
                                                                            });
                                                                            fetchData();
                                                                        }
                                                                    }}
                                                                    variant="primary"
                                                                >
                                                                    Verify
                                                                </ActionButton>
                                                            ) : (
                                                                <ActionButton
                                                                    onClick={async () => {
                                                                        if (confirm(`Revoke verification for ${u.name}?`)) {
                                                                            await fetch('/api/admin/verify-user', {
                                                                                method: 'PUT',
                                                                                body: JSON.stringify({ user_id: u.id, is_verified: false })
                                                                            });
                                                                            fetchData();
                                                                        }
                                                                    }}
                                                                    variant="danger"
                                                                >
                                                                    Revoke
                                                                </ActionButton>
                                                            )}
                                                        </div>
                                                    </Td>
                                                </TableRow>
                                            ))}
                                        </tbody>
                                    </Table>
                                </motion.div>
                            )}

                            {activeTab === 'events' && (
                                <motion.div
                                    key="events"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Table>
                                        <TableHeader>
                                            <Th>Title</Th>
                                            <Th>Organizer</Th>
                                            <Th>Status</Th>
                                            <Th>Date</Th>
                                            <Th align="right">Actions</Th>
                                        </TableHeader>
                                        <tbody>
                                            {events.map((e, i) => (
                                                <TableRow key={e.event_id} index={i}>
                                                    <Td className="font-bold text-white">{e.title}</Td>
                                                    <Td className="text-gray-400">{e.organizer_name}</Td>
                                                    <Td>
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold uppercase ${e.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                                e.status === 'DRAFT' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                                    'bg-red-500/10 text-red-500 border border-red-500/20'
                                                            }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${e.status === 'PUBLISHED' ? 'bg-green-500' :
                                                                    e.status === 'DRAFT' ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`} />
                                                            {e.status}
                                                        </span>
                                                    </Td>
                                                    <Td>{new Date(e.start_time).toLocaleDateString()}</Td>
                                                    <Td align="right">
                                                        <ActionButton
                                                            onClick={async () => {
                                                                if (confirm('Delete this event?')) {
                                                                    await fetch(`/api/events/${e.event_id}`, { method: 'DELETE' });
                                                                    fetchData();
                                                                }
                                                            }}
                                                            variant="danger"
                                                        >
                                                            Delete
                                                        </ActionButton>
                                                    </Td>
                                                </TableRow>
                                            ))}
                                        </tbody>
                                    </Table>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// Sub-components for cleaner code
function StatCard({ title, value, icon, color, index }: any) {
    const colors: any = {
        orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/20 text-orange-500',
        cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-500',
        purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-500'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (index * 0.1) }}
            className={`bg-gradient-to-br ${colors[color]} p-6 rounded-3xl border relative overflow-hidden group`}
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500`}>
                {icon}
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-4xl font-black text-white">{value}</p>
        </motion.div>
    );
}

function TabButton({ id, label, icon, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${active
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon} {label}
        </button>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Search className="text-gray-600" size={32} />
            </div>
            <p className="text-gray-400 text-lg">{message}</p>
        </div>
    );
}

function Table({ children }: { children: React.ReactNode }) {
    return <table className="w-full text-left border-collapse">{children}</table>;
}

function TableHeader({ children }: { children: React.ReactNode }) {
    return (
        <thead>
            <tr className="border-b border-white/5">
                {children}
            </tr>
        </thead>
    );
}

function Th({ children, align = 'left' }: { children: React.ReactNode, align?: 'left' | 'right' }) {
    return <th className={`pb-4 pt-2 font-medium text-gray-500 text-xs uppercase tracking-wider ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function TableRow({ children, index }: { children: React.ReactNode, index: number }) {
    return (
        <motion.tr
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
        >
            {children}
        </motion.tr>
    );
}

function Td({ children, align = 'left', className = '' }: { children: React.ReactNode, align?: 'left' | 'right', className?: string }) {
    return <td className={`py-4 ${align === 'right' ? 'text-right' : 'text-left'} text-sm text-gray-300 ${className}`}>{children}</td>;
}

function ActionButton({ children, onClick, variant = 'primary' }: any) {
    const variants: any = {
        primary: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white',
        success: 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white',
        danger: 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white',
    };

    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 ${variants[variant]}`}
        >
            {children}
        </button>
    );
}
