import {
    ArrowLeft,
    Home,
    LogOut,
    Search,
    ShoppingBag,
    UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/types';
import { csrfToken } from '@/const/data';

type Props = {
    user: User;
    active: 'home' | 'shop' | 'detail' | 'cart';
    cartCount?: number;
    onHomeClick: () => void;
    onShopClick: () => void;
    onCartClick: () => void;
    onLogout: () => void;
    backLabel?: string;
};

export default function CustomerNavbar({
    user,
    active,
    cartCount = 0,
    onHomeClick,
    onShopClick,
    onCartClick,
    onLogout,
    backLabel = 'Shop',
}: Props) {
    async function logout() {
        await fetch('/logout', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
            },
        });

        onLogout();
        window.history.replaceState({}, '', '/login');
    }

    return (
        <header className="sticky top-0 z-50 flex w-full max-w-full items-center justify-between border-b border-customer-outline-variant/20 bg-customer-surface-container-lowest/95 px-5 py-5 shadow-sm backdrop-blur-md md:px-10">
            <div className="flex items-center gap-8">
                <button
                    type="button"
                    onClick={active === 'detail' ? onShopClick : onHomeClick}
                    className="text-display-lg font-display-lg tracking-tighter text-customer-primary"
                >
                    ESTHETIQUE
                </button>
                {active === 'detail' ? (
                    <button
                        type="button"
                        onClick={onShopClick}
                        className="text-label-caps flex items-center gap-2 font-label-caps text-customer-secondary transition-colors hover:text-customer-primary"
                    >
                        <ArrowLeft className="size-4" />
                        {backLabel}
                    </button>
                ) : (
                    <nav className="hidden items-center gap-6 md:flex">
                        <button
                            type="button"
                            onClick={onHomeClick}
                            className={navClass(active === 'home')}
                        >
                            <Home className="size-4" />
                            Home
                        </button>
                        <button
                            type="button"
                            onClick={onShopClick}
                            className={navClass(active === 'shop')}
                        >
                            Shop
                        </button>
                        <span className="text-label-caps font-label-caps text-customer-secondary">
                            Essentials
                        </span>
                        <span className="text-label-caps font-label-caps text-customer-secondary">
                            Journal
                        </span>
                    </nav>
                )}
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="hidden cursor-pointer text-customer-primary transition-opacity hover:opacity-70 sm:block"
                >
                    <Search className="size-5" />
                </button>
                <button
                    type="button"
                    onClick={onCartClick}
                    className={`relative cursor-pointer text-customer-primary transition-opacity hover:opacity-70 ${
                        active === 'cart' ? 'opacity-100' : ''
                    }`}
                >
                    <ShoppingBag className="size-5" />
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 grid min-h-5 min-w-5 place-items-center rounded-full bg-customer-primary px-1 text-[10px] leading-none text-customer-surface">
                            {cartCount}
                        </span>
                    )}
                </button>
                <span className="hidden items-center gap-2 text-sm text-customer-secondary lg:flex">
                    <UserRound className="size-4" />
                    {user.email}
                </span>
                <Button variant="outline" onClick={logout}>
                    <LogOut className="size-4" />
                    Logout
                </Button>
            </div>
        </header>
    );
}

function navClass(isActive: boolean): string {
    const base =
        'font-label-caps text-label-caps flex items-center gap-2 transition-colors duration-300 hover:text-customer-primary';

    return isActive
        ? `${base} border-b border-customer-primary pb-1 font-bold text-customer-primary`
        : `${base} text-customer-secondary`;
}
