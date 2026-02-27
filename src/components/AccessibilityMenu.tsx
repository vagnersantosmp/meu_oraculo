import { useState, useRef, useEffect } from 'react';
import { Accessibility, Type, Contrast, Sun, RotateCcw } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { Card } from './ui';

export function AccessibilityMenu() {
    const {
        fontSize, setFontSize,
        highContrast, setHighContrast,
        contrastLevel, setContrastLevel,
        brightness, setBrightness,
        resetAccessibility
    } = useAccessibility();

    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full shadow-md transition-all ${isOpen
                    ? 'bg-primary/90 text-white'
                    : 'bg-primary text-white hover:bg-primary/90 hover:scale-105'
                    }`}
                aria-label="Opções de Acessibilidade"
            >
                <Accessibility className="w-5 h-5" />
            </button>

            {isOpen && (
                <Card className="absolute left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:-translate-x-0 mt-2 top-full w-[280px] sm:w-80 p-4 z-50 shadow-xl border border-border animate-in fade-in zoom-in duration-200 origin-top md:origin-top-right">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                            <Accessibility className="w-4 h-4 text-primary" />
                            Acessibilidade
                        </h3>
                        <button
                            onClick={resetAccessibility}
                            className="p-1.5 text-text-secondary hover:text-primary bg-muted rounded-md transition-colors"
                            title="Restaurar Padrão"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Font Size Slider */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-text-primary font-medium">
                                    <Type className="w-4 h-4 text-text-secondary" />
                                    Tamanho da Fonte
                                </label>
                                <span className="text-text-secondary text-xs">{Math.round(fontSize * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.8"
                                max="1.5"
                                step="0.1"
                                value={fontSize}
                                onChange={(e) => setFontSize(parseFloat(e.target.value))}
                                className="w-full accent-primary bg-muted rounded-lg appearance-none h-2"
                            />
                        </div>

                        {/* Contrast Control Group */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-text-primary font-medium">
                                    <Contrast className="w-4 h-4 text-text-secondary" />
                                    Contraste
                                </label>
                            </div>

                            <button
                                onClick={() => setHighContrast(!highContrast)}
                                className={`w-full py-2 px-4 rounded-xl text-sm font-semibold transition-all border ${highContrast
                                    ? 'bg-primary text-white border-transparent shadow-md'
                                    : 'bg-muted text-text-secondary border-border hover:bg-border'
                                    }`}
                            >
                                {highContrast ? 'Modo: Alto Contraste' : 'Modo Padrão'}
                            </button>

                            <div className="pt-2 flex items-center gap-2">
                                <span className="text-xs text-text-secondary">Normal</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="2"
                                    step="0.05"
                                    value={contrastLevel}
                                    onChange={(e) => setContrastLevel(parseFloat(e.target.value))}
                                    className="w-full accent-primary bg-muted rounded-lg appearance-none h-2"
                                />
                                <span className="text-xs text-text-secondary">Forte</span>
                            </div>
                        </div>

                        {/* Brightness Slider */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-text-primary font-medium">
                                    <Sun className="w-4 h-4 text-text-secondary" />
                                    Brilho
                                </label>
                                <span className="text-text-secondary text-xs">{Math.round(brightness * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="1"
                                step="0.1"
                                value={brightness}
                                onChange={(e) => setBrightness(parseFloat(e.target.value))}
                                className="w-full accent-primary bg-muted rounded-lg appearance-none h-2"
                            />
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
