export default function AppLogo() {
    return (
        <>
            <div className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#1A1917]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                        fill="white"
                    />
                </svg>
            </div>
            <span className="truncate text-[16px] font-medium text-[#1A1917]">
                Hub Casa
            </span>
        </>
    );
}
