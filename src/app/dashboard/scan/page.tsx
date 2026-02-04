'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    QrCode, ArrowLeft, CheckCircle, XCircle, AlertCircle,
    Loader, Minimize, ScanLine, User, Calendar, RefreshCcw
} from 'lucide-react';

export default function ScanPage() {
    const router = useRouter();
    const [scanResult, setScanResult] = useState<any>(null);
    const [scanning, setScanning] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
        setLoading(false);
    }, [router]);

    useEffect(() => {
        if (!user || user.role !== 'organizer') return;

        // Initialize Scanner
        // Use a timeout to ensure DOM is ready
        const timeout = setTimeout(() => {
            if (!scannerRef.current) {
                // Check if element exists
                const readerElement = document.getElementById("reader");

                if (readerElement) {
                    try {
                        const scanner = new Html5QrcodeScanner(
                            "reader",
                            {
                                fps: 10,
                                qrbox: { width: 250, height: 250 },
                                aspectRatio: 1.0,
                                showTorchButtonIfSupported: true,
                                disableFlip: false
                            },
                            /* verbose= */ false
                        );

                        scanner.render(onScanSuccess, onScanFailure);
                        scannerRef.current = scanner;
                    } catch (e) {
                        console.error("Failed to initialize scanner", e);
                    }
                }
            }
        }, 800);

        return () => {
            clearTimeout(timeout);
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(console.error);
                } catch (e) { console.error("Scanner clear error", e); }
                scannerRef.current = null;
            }
        };
    }, [user, scanResult]); // Re-init if scanResult is cleared and we go back to scanning mode? Actually simpler to just hide/show div

    const onScanSuccess = async (decodedText: string) => {
        if (!scanning) return;

        // Temporarily pause to process
        setScanning(false);
        if (scannerRef.current) {
            try { scannerRef.current.pause(); } catch (e) { }
        }

        validateTicket(decodedText);
    };

    const onScanFailure = (error: any) => {
        // console.warn(`Code scan error = ${error}`);
    };

    const validateTicket = async (code: string) => {
        try {
            const res = await fetch('/api/bookings/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, organizer_id: user.id })
            });

            const data = await res.json();

            // If the server returns valid: true/false, we use that.
            // Assuming data structure: { valid: boolean, message: string, ticket?: object }
            setScanResult({ ...data, unique_code: code });

            // Audio feedback
            const audioPath = data.valid ? '/sounds/success.mp3' : '/sounds/error.mp3';
            // Simple check ideally, but for now we trust file existence or ignore error
            new Audio(audioPath).play().catch(() => { });

        } catch (err) {
            console.error(err);
            setError('Network Error');
            setScanResult({ valid: false, message: 'Network Error', unique_code: code });
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setError(null);
        setScanning(true);
        if (scannerRef.current) {
            try { scannerRef.current.resume(); } catch (e) { }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
                <Loader className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'organizer') {
        return (
            <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white p-6">
                <div className="text-center bg-[#161B2B] p-8 rounded-3xl border border-white/5 max-w-md w-full">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="text-red-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-gray-400 mb-6">Only organizers can scan tickets.</p>
                    <button onClick={() => router.push('/dashboard')} className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F1A] text-white overflow-hidden relative selection:bg-cyan-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60vw] h-[60vw] bg-cyan-500/05 rounded-full blur-[100px]" />
            </div>

            <style>
                {`
                    #reader__scan_region {
                        background: transparent !important;
                    }
                    #reader__dashboard_section_csr span, 
                    #reader__dashboard_section_swaplink { 
                        display: none !important; 
                    }
                    #reader video {
                        object-fit: cover;
                        border-radius: 1.5rem;
                    }
                `}
            </style>

            <div className="relative z-10 max-w-md mx-auto p-6 h-screen flex flex-col">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <ScanLine size={20} className="text-cyan-400" /> Scanner
                    </h1>
                    <div className="w-10" /> {/* Spacer */}
                </motion.header>

                {/* Main Content */}
                <div className="flex-1 flex flex-col relative w-full">

                    {/* Scanner Box */}
                    <AnimatePresence mode="wait">
                        {!scanResult && (
                            <motion.div
                                key="scanner"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                className="flex-1 flex flex-col justify-center"
                            >
                                <div className="relative overflow-hidden rounded-3xl border-2 border-white/10 bg-black shadow-2xl">
                                    {/* Scanner Overlay UI */}
                                    <div className="absolute inset-0 z-10 pointer-events-none border-[50px] border-black/50">
                                        <div className="w-full h-full border-2 border-cyan-400/50 relative">
                                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cyan-500" />
                                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cyan-500" />
                                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cyan-500" />
                                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cyan-500" />
                                            {/* Scanning Line Animation */}
                                            <motion.div
                                                animate={{ top: ['0%', '100%'] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="absolute left-0 w-full h-[2px] bg-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                            />
                                        </div>
                                    </div>

                                    {/* HTML5 QR Code Container */}
                                    <div id="reader" className="w-full h-full bg-black min-h-[300px]" />
                                </div>
                                <p className="text-center text-gray-400 text-sm mt-8 animate-pulse">
                                    Point camera at attendee's QR code
                                </p>
                            </motion.div>
                        )}

                        {/* Result View */}
                        {scanResult && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                className="flex-1 flex flex-col justify-center"
                            >
                                <div className={`relative rounded-[2.5rem] p-8 text-center border-t border-white/10 shadow-2xl overflow-hidden ${scanResult.valid ? 'bg-gradient-to-b from-[#161B2B] to-green-900/20' : 'bg-gradient-to-b from-[#161B2B] to-red-900/20'
                                    }`}>
                                    {/* Result Icon */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                        className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.3)] border-4 border-[#0B0F1A] ${scanResult.valid ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-red-400 to-red-600'
                                            }`}
                                    >
                                        {scanResult.valid ? (
                                            <CheckCircle size={48} className="text-white" strokeWidth={3} />
                                        ) : (
                                            <XCircle size={48} className="text-white" strokeWidth={3} />
                                        )}
                                    </motion.div>

                                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                                        {scanResult.valid ? 'Access Granted' : 'Invalid Ticket'}
                                    </h2>
                                    <p className={`text-sm font-medium mb-8 uppercase tracking-widest ${scanResult.valid ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {scanResult.message}
                                    </p>

                                    {/* Ticket Details */}
                                    {scanResult.ticket && (
                                        <div className="bg-black/30 rounded-2xl p-5 text-left space-y-4 mb-8 border border-white/5 backdrop-blur-sm">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-white/5 rounded-lg flex-shrink-0">
                                                    <User size={20} className="text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Attendee</p>
                                                    <p className="text-lg font-bold text-white leading-tight">{scanResult.ticket.attendee_name}</p>
                                                    <p className="text-xs text-gray-400">{scanResult.ticket.attendee_email}</p>
                                                </div>
                                            </div>

                                            <div className="w-full h-px bg-white/10" />

                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-white/5 rounded-lg flex-shrink-0">
                                                    <Calendar size={20} className="text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Event</p>
                                                    <p className="text-sm font-medium text-white">{scanResult.ticket.event_title}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {scanResult.unique_code}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={resetScanner}
                                        className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl"
                                    >
                                        <RefreshCcw size={20} />
                                        Scan Next Ticket
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
