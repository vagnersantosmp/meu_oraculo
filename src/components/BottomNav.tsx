import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Car, Wallet, CalendarDays, User, CreditCard, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

// Primary items — always visible in the bottom bar (max 5 slots)
const primaryItems = [
    { to: '/', label: 'Início', icon: Home, color: 'text-sky-600 dark:text-sky-400', end: true },
    { to: '/shopping', label: 'Mercado', icon: ShoppingCart, color: 'text-purple-600 dark:text-purple-400' },
    { to: '/ledger', label: 'Caixa', icon: Wallet, color: 'text-orange-600 dark:text-orange-400' },
    { to: '/bills', label: 'Contas', icon: CalendarDays, color: 'text-indigo-600 dark:text-indigo-400' },
];

// Secondary items — hidden inside the "Mais" panel
const moreItems = [
    { to: '/car', label: 'Carro', icon: Car, color: 'text-blue-600 dark:text-blue-400' },
    { to: '/cards', label: 'Cartões', icon: CreditCard, color: 'text-pink-600 dark:text-pink-400' },
    { to: '/profile', label: 'Perfil', icon: User, color: 'text-emerald-600 dark:text-emerald-400' },
];

const moreRoutes = moreItems.map(i => i.to);

export function BottomNav() {
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const location = useLocation();
    const panelRef = useRef<HTMLDivElement>(null);
    const moreButtonRef = useRef<HTMLButtonElement>(null);

    // Check if current route is inside the "Mais" group
    const isMoreActive = moreRoutes.some(r => location.pathname === r || location.pathname.startsWith(r + '/'));

    // Close panel when route changes
    useEffect(() => {
        setIsMoreOpen(false);
    }, [location.pathname]);

    // Close panel on outside click
    useEffect(() => {
        if (!isMoreOpen) return;
        const handleOutsideClick = (e: MouseEvent) => {
            if (
                panelRef.current && !panelRef.current.contains(e.target as Node) &&
                moreButtonRef.current && !moreButtonRef.current.contains(e.target as Node)
            ) {
                setIsMoreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isMoreOpen]);

    return (
        <nav className="bg-card/95 backdrop-blur-md border-t border-border px-2 pt-2 pb-2 transition-colors duration-300 relative">

            {/* "Mais" floating panel */}
            {isMoreOpen && (
                <div
                    ref={panelRef}
                    className={cn(
                        "absolute bottom-full left-2 right-2 mb-2",
                        "bg-card/95 backdrop-blur-xl border border-border rounded-2xl",
                        "shadow-xl shadow-black/30 p-3",
                        "grid grid-cols-3 gap-2",
                        "animate-in slide-in-from-bottom-2 fade-in duration-150"
                    )}
                >
                    {moreItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => cn(
                                "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl",
                                "border transition-all duration-150",
                                isActive
                                    ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                                    : "bg-muted border-border hover:bg-muted/80 active:scale-95"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        size={22}
                                        strokeWidth={2}
                                        className={isActive ? 'text-primary' : item.color}
                                    />
                                    <span className={cn(
                                        "text-[11px] font-semibold",
                                        isActive ? "text-primary" : "text-text-primary"
                                    )}>
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            )}

            {/* Fixed bottom bar */}
            <div className="flex gap-1.5 max-w-2xl mx-auto">
                {/* Primary nav items */}
                {primaryItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end || false}
                        className={({ isActive }) => cn(
                            "flex flex-col items-center justify-center py-2 rounded-xl gap-1 transition-all duration-200 flex-1",
                            "bg-card border border-border shadow-sm",
                            isActive
                                ? "ring-1 ring-primary/50 border-primary/30 bg-primary/5 scale-[1.02]"
                                : "hover:bg-muted active:scale-95"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={18} strokeWidth={2} className={isActive ? 'text-primary' : item.color} />
                                <span className={cn(
                                    "font-medium text-[10px] leading-none",
                                    isActive ? "text-primary" : "text-text-primary"
                                )}>
                                    {item.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}

                {/* "Mais" button */}
                <button
                    ref={moreButtonRef}
                    onClick={() => setIsMoreOpen(prev => !prev)}
                    className={cn(
                        "flex flex-col items-center justify-center py-2 rounded-xl gap-1 transition-all duration-200 flex-1",
                        "border shadow-sm",
                        isMoreOpen || isMoreActive
                            ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30 text-primary scale-[1.02]"
                            : "bg-card border-border hover:bg-muted active:scale-95"
                    )}
                >
                    <MoreHorizontal
                        size={18}
                        strokeWidth={2}
                        className={cn(
                            "transition-transform duration-200",
                            isMoreOpen && "rotate-90",
                            isMoreOpen || isMoreActive ? "text-primary" : "text-violet-500 dark:text-violet-400"
                        )}
                    />
                    <span className={cn(
                        "font-medium text-[10px] leading-none",
                        isMoreOpen || isMoreActive ? "text-primary" : "text-text-primary"
                    )}>
                        Mais
                    </span>
                </button>
            </div>
        </nav>
    );
}
