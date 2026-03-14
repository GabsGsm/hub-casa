import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md border border-[var(--hc-gray-200)] bg-white text-[var(--hc-gray-900)]">
                <AppLogoIcon className="size-4 fill-current" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate text-base font-medium leading-tight">
                    Hub Casa
                </span>
            </div>
        </>
    );
}
