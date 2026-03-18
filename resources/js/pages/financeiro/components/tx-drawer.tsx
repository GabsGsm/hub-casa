import { X } from 'lucide-react';
import type { ReactNode } from 'react';

type TxDrawerProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    submitLabel?: string;
    onSubmit: (e: React.FormEvent) => void;
    processing?: boolean;
    children: ReactNode;
};

export function TxDrawer({
    open,
    onClose,
    title,
    submitLabel = 'Salvar',
    onSubmit,
    processing = false,
    children,
}: TxDrawerProps) {
    return (
        <>
            {open && <div className="fixed inset-0 z-40 bg-[#1A1917]/20" onClick={onClose} />}
            <div
                className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[#E4E3E0] bg-white transition-transform duration-200 ease-out sm:w-[400px] ${
                    open ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-[#E4E3E0] px-5 py-4">
                    <span className="text-[16px] font-medium text-[#1A1917]">{title}</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[#9B9A96] transition-colors hover:text-[#1A1917]"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
                        {children}
                    </div>
                    <div className="flex shrink-0 items-center gap-3 border-t border-[#E4E3E0] px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-[#6B6A67] transition-colors hover:text-[#1A1917]"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="h-9 flex-1 rounded-[8px] bg-[#1A1917] text-sm text-white transition-colors hover:bg-[#3D3C3A] disabled:opacity-60"
                        >
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
