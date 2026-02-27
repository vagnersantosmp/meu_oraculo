import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Car, Wallet, User, CalendarDays, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';

export function SideNav() {
    const navItems = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/shopping', label: 'Supermercado', icon: ShoppingCart },
        { to: '/car', label: 'Carro', icon: Car },
        { to: '/ledger', label: 'Caixa', icon: Wallet },
        { to: '/bills', label: 'Contas Fixas', icon: CalendarDays },
        { to: '/cards', label: 'Cartões', icon: CreditCard },
        { to: '/profile', label: 'Perfil', icon: User },
    ];

    return (
        <div className="flex flex-col h-full bg-card border-r border-border">
            {/* Logo / Title */}
            <div className="p-6 border-b border-border flex items-center gap-3">
                <img src="/favicon.png" alt="Meu Oráculo" className="w-9 h-9 rounded-lg shadow-md" />
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Meu Oráculo</h1>
                    <p className="text-xs text-text-secondary">Gestão Financeira</p>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-text-secondary hover:bg-muted hover:text-text-primary"
                            )
                        }
                    >
                        <item.icon size={20} strokeWidth={2} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>


        </div>
    );
}
