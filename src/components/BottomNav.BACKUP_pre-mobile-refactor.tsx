import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Car, Wallet, CalendarDays, User, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';

const quickItems = [
    { to: '/', label: 'Início', icon: Home, color: 'text-sky-600 dark:text-sky-400', end: true },
    { to: '/shopping', label: 'Mercado', icon: ShoppingCart, color: 'text-purple-600 dark:text-purple-400' },
    { to: '/car', label: 'Carro', icon: Car, color: 'text-blue-600 dark:text-blue-400' },
    { to: '/ledger', label: 'Caixa', icon: Wallet, color: 'text-orange-600 dark:text-orange-400' },
    { to: '/bills', label: 'Contas', icon: CalendarDays, color: 'text-indigo-600 dark:text-indigo-400' },
    { to: '/cards', label: 'Cartões', icon: CreditCard, color: 'text-pink-600 dark:text-pink-400' },
    { to: '/profile', label: 'Perfil', icon: User, color: 'text-emerald-600 dark:text-emerald-400' },
];

export function BottomNav() {
    return (
        <nav className="bg-card/95 backdrop-blur-md border-t border-border px-3 pt-2 pb-2 transition-colors duration-300">
            <div className="flex overflow-x-auto no-scrollbar gap-2 max-w-2xl mx-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {quickItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end || false}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center py-2 rounded-xl gap-1 transition-all duration-200 min-w-[64px] flex-1 flex-shrink-0",
                                "bg-card border border-border shadow-sm",
                                isActive
                                    ? "ring-1 ring-primary/50 border-primary/30 bg-primary/5 scale-[1.02]"
                                    : "hover:bg-muted active:scale-95"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={18} strokeWidth={2} className={cn(isActive ? 'text-primary' : item.color)} />
                                <span className={cn(
                                    "font-medium text-[10px] leading-none",
                                    isActive ? "text-primary" : "text-text-primary"
                                )}>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
