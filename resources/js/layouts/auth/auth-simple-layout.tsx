import { Link } from '@inertiajs/react';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({ children, description }: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-[#F8F8F7] px-4">
            <div className="w-full max-w-[360px]">
                {/* Logo — centered stack like v2 */}
                <div className="mb-8 flex flex-col items-center">
                    <Link href="/" className="flex flex-col items-center gap-0">
                        <div className="mb-3 flex size-10 items-center justify-center rounded-[10px] bg-[#1A1917]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                                    fill="white"
                                />
                            </svg>
                        </div>
                        <span className="text-[20px] font-semibold text-[#1A1917]">Hub Casa</span>
                    </Link>
                    {description && (
                        <p className="mt-1 text-sm text-[#9B9A96]">{description}</p>
                    )}
                </div>

                {/* Card — no title inside, just children */}
                <div className="rounded-[12px] border border-[#E4E3E0] bg-white px-6 py-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
