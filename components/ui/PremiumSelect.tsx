
import React, { useState, useRef, useEffect } from 'react';

interface PremiumSelectProps {
    label?: string;
    icon?: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
}

const PremiumSelect: React.FC<PremiumSelectProps> = ({ label, icon, value, options, onChange, placeholder = 'SELECCIONAR...', className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className={`neu-input-wrapper group/field relative ${className || ''}`} ref={containerRef}>
            {label && <label className="neu-input-label !bg-white">{label}</label>}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`neu-input !h-16 flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-[var(--primary)] shadow-[var(--neu-pressed-sm)]' : 'border-slate-100 shadow-sm'} ${!label ? '!mt-0' : ''}`}
            >
                <span className={`text-[11px] font-black uppercase tracking-[0.15em] truncate pr-4 ${value ? 'text-[var(--on-surface)]' : 'opacity-30'}`}>
                    {selectedLabel}
                </span>
                <span className={`material-symbols-outlined text-slate-300 transition-transform duration-500 ${isOpen ? 'rotate-180 text-[var(--primary)]' : ''}`}>
                    {icon || 'expand_more'}
                </span>
            </div>

            {isOpen && (
                <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white rounded-[1.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-slate-100 z-[100] py-4 animate-fade-in overflow-hidden backdrop-blur-xl">
                    <div className="max-h-[250px] overflow-y-auto no-scrollbar">
                        {options.map((opt) => (
                            <div 
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer hover:bg-slate-50 ${value === opt.value ? 'text-[var(--primary)] bg-slate-50/50' : 'text-slate-400'}`}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PremiumSelect;
