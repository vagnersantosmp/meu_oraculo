import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header, Card } from '../components/ui';
import { Moon, Sun, Monitor, User, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

export function Profile() {
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();

    const userName = user?.user_metadata?.name || 'Usuário';
    const userEmail = user?.email || '';

    const themes: { id: Theme; label: string; icon: any; color: string }[] = [
        { id: 'light', label: 'Claro', icon: Sun, color: 'bg-yellow-100 text-yellow-600' },
        { id: 'dark', label: 'Escuro', icon: Moon, color: 'bg-indigo-100 text-indigo-600' },
        { id: 'soft', label: 'Suave', icon: Monitor, color: 'bg-stone-100 text-stone-600' },
    ];

    return (
        <div className="pb-20">
            <Header title="Perfil" />

            <div className="p-4 md:p-6 lg:p-8 space-y-6">

                {/* User Profile Card */}
                <Card className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                        <User size={32} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-text-primary">{userName}</h2>
                        <p className="text-sm text-text-secondary">{userEmail}</p>
                    </div>
                </Card>

                {/* Appearance Settings */}
                <section>
                    <h3 className="font-semibold mb-3 text-text-primary">Aparência</h3>
                    <Card>
                        <div className="grid grid-cols-3 gap-2">
                            {themes.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                                        theme === t.id
                                            ? "border-primary bg-primary/5"
                                            : "border-transparent hover:bg-muted"
                                    )}
                                >
                                    <div className={cn("p-2 rounded-full mb-2", t.color)}>
                                        <t.icon size={20} />
                                    </div>
                                    <span className="text-xs font-medium text-text-primary">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </Card>
                </section>

                {/* Logout */}
                <section>
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-semibold text-sm hover:bg-red-500/20 transition-all"
                    >
                        <LogOut size={18} />
                        Sair da conta
                    </button>
                </section>

                <div className="text-center text-xs text-text-secondary mt-8">
                    Meu Oráculo v1.0.0
                </div>
            </div>
        </div>
    );
}
