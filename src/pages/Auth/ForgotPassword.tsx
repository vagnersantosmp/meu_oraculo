import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Wallet, ArrowLeft } from 'lucide-react';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="w-full max-w-sm text-center space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                        <span className="text-3xl text-white">✉</span>
                    </div>
                    <h2 className="text-xl font-bold text-text-primary">E-mail enviado!</h2>
                    <p className="text-sm text-text-secondary">
                        Enviamos um link de recuperação para <strong className="text-text-primary">{email}</strong>. Verifique sua caixa de entrada e spam.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                    >
                        <ArrowLeft size={16} />
                        Voltar para o login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-8">
                {/* Logo */}
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                        <Wallet size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary">Recuperar Senha</h1>
                    <p className="text-sm text-text-secondary mt-1">Informe seu e-mail para receber o link de recuperação</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Enviando...
                            </span>
                        ) : 'Enviar link de recuperação'}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center">
                    <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline">
                        <ArrowLeft size={14} />
                        Voltar para o login
                    </Link>
                </p>
            </div>
        </div>
    );
}
