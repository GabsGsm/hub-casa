import { Link } from '@inertiajs/react';
import type { AuthLayoutProps } from '@/types';

/* Figma: bg-[#F8F8F7], card bg-white border rounded-[12px], logo top */
export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-[#F8F8F7] p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">

                    {/* Logo */}
                    <div className="flex justify-center">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-[8px] bg-[#1A1917]">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                                        fill="white"
                                    />
                                </svg>
                            </div>
                            <span className="text-[16px] font-medium text-[#1A1917]">Hub Casa</span>
                        </Link>
                    </div>

                    {/* Card */}
                    <div className="rounded-[12px] border border-[#E4E3E0] bg-white px-8 py-8">
                        <div className="mb-6">
                            <h1 className="text-xl font-semibold text-[#1A1917]">{title}</h1>
                            {description && (
                                <p className="mt-1 text-sm text-[#9B9A96]">{description}</p>
                            )}
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
