import { useToast } from '../../context/ToastContext';
import type { Toast, ToastType } from '../../context/ToastContext';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const configs: Record<ToastType, { icon: typeof CheckCircle; colors: string }> = {
    success: {
        icon: CheckCircle,
        colors: 'bg-green-950/90 border-green-700/50 text-green-100',
    },
    error: {
        icon: AlertCircle,
        colors: 'bg-red-950/90 border-red-700/50 text-red-100',
    },
    warning: {
        icon: AlertTriangle,
        colors: 'bg-yellow-950/90 border-yellow-700/50 text-yellow-100',
    },
    info: {
        icon: Info,
        colors: 'bg-gray-900/95 border-gray-700/50 text-gray-100',
    },
};

function ToastItem({ toast }: { toast: Toast }) {
    const { dismiss } = useToast();
    const { icon: Icon, colors } = configs[toast.type];

    return (
        <div
            className={cn(
                'flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-xl',
                'w-[calc(100vw-32px)] max-w-sm',
                'animate-in slide-in-from-bottom-2 fade-in duration-200',
                colors
            )}
        >
            <Icon size={18} className="flex-shrink-0 mt-0.5 opacity-90" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{toast.title}</p>
                {toast.message && (
                    <p className="text-xs opacity-70 mt-0.5 leading-snug">{toast.message}</p>
                )}
            </div>
            <button
                onClick={() => dismiss(toast.id)}
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
                <X size={15} />
            </button>
        </div>
    );
}

export function ToastContainer() {
    const { toasts } = useToast();
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem toast={t} />
                </div>
            ))}
        </div>
    );
}
