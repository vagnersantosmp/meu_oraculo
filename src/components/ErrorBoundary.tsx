import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
                    <div className="max-w-md w-full bg-gray-900 p-6 rounded-2xl shadow-2xl border border-red-900/40">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">⚠️</span>
                            <div>
                                <h1 className="text-lg font-bold text-white">Algo deu errado</h1>
                                <p className="text-sm text-gray-400">A aplicação encontrou um erro inesperado.</p>
                            </div>
                        </div>

                        {this.state.error && (
                            <details className="mb-4">
                                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 mb-1">
                                    Ver detalhes do erro
                                </summary>
                                <div className="bg-gray-800 p-3 rounded-lg overflow-auto text-xs font-mono text-red-300 border border-gray-700 mt-2 max-h-32">
                                    {this.state.error.toString()}
                                </div>
                            </details>
                        )}

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors text-sm"
                            >
                                🔄 Recarregar página
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm('Isso vai limpar os dados locais do app (cache). Continuar?')) {
                                        localStorage.clear();
                                        window.location.reload();
                                    }
                                }}
                                className="w-full py-2 px-4 bg-transparent border border-gray-700 hover:border-red-700 text-gray-400 hover:text-red-400 rounded-xl font-medium transition-colors text-sm"
                            >
                                Limpar cache e recarregar
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
