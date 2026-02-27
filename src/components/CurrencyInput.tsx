import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';
import { cn } from '../lib/utils';

interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
    onBlur?: () => void;
    autoFocus?: boolean;
}

export function CurrencyInput({
    value,
    onChange,
    className,
    disabled = false,
    placeholder = "0,00",
    onBlur,
    autoFocus
}: CurrencyInputProps) {
    const [rawValue, setRawValue] = useState<number>(Math.round(value * 100));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const newRaw = Math.round(value * 100);
        if (newRaw !== rawValue) {
            setRawValue(newRaw);
        }
    }, [value]);

    const formatDisplay = (centavos: number): string => {
        if (centavos === 0) return '';
        const reais = centavos / 100;
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(reais);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const onlyDigits = e.target.value.replace(/\D/g, '');
        const numericValue = parseInt(onlyDigits, 10) || 0;
        setRawValue(numericValue);
        onChange(numericValue / 100);
    };

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    return (
        <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none">
                R$
            </span>
            <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={formatDisplay(rawValue)}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={onBlur}
                disabled={disabled}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className={cn(
                    "pl-8 text-right w-full h-9 rounded-lg border border-border bg-card text-text-primary px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50",
                    className
                )}
            />
        </div>
    );
}
