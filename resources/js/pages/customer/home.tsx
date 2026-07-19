import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ImagePlus,
    MessageSquareText,
    PackageCheck,
    ShoppingBag,
} from 'lucide-react';
import CustomerNavbar from '@/components/customer/customer-navbar';
import { getCategories } from '@/api/categories';
import { getFeaturedProducts, getProducts } from '@/api/products';
import { money } from '@/const/data';
import { categoryDisplayName } from '@/lib/category';
import type { Category, Product, User } from '@/types/types';

type Props = {
    user: User;
    cartCount: number;
    onProductClick: (productId: number) => void;
    onShopClick: () => void;
    onCartClick: () => void;
    onOrdersClick: () => void;
    onMessagesClick: () => void;
    onLogout: () => void;
};

export default function CustomerHome({
    user,
    cartCount,
    onProductClick,
    onShopClick,
    onCartClick,
    onOrdersClick,
    onMessagesClick,
    onLogout,
}: Props) {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [canScrollFeaturedLeft, setCanScrollFeaturedLeft] = useState(false);
    const [canScrollFeaturedRight, setCanScrollFeaturedRight] = useState(false);
    const [activeFeaturedProduct, setActiveFeaturedProduct] = useState(0);
    const featuredCarouselRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.title = 'Home - Boutique';

        Promise.all([getFeaturedProducts(), getProducts(), getCategories()])
            .then(([featuredPayload, productsPayload, categoriesPayload]) => {
                setFeaturedProducts(featuredPayload.data.slice(0, 10));
                setProducts(productsPayload.data.slice(0, 12));
                setCategories(
                    categoriesPayload.data
                        .filter((category) => category.is_active)
                        .slice(0, 8),
                );
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const carousel = featuredCarouselRef.current;

        if (!carousel || featuredProducts.length === 0) {
            return;
        }

        const updateScrollControls = () => {
            setCanScrollFeaturedLeft(carousel.scrollLeft > 1);
            setCanScrollFeaturedRight(
                carousel.scrollLeft + carousel.clientWidth <
                    carousel.scrollWidth - 1,
            );

            const firstCard = carousel.querySelector<HTMLElement>(
                '[data-featured-card]',
            );

            if (firstCard) {
                const cardGap = 24;
                setActiveFeaturedProduct(
                    Math.min(
                        featuredProducts.length - 1,
                        Math.round(
                            carousel.scrollLeft /
                                (firstCard.offsetWidth + cardGap),
                        ),
                    ),
                );
            }
        };
        const resizeObserver = new ResizeObserver(updateScrollControls);

        updateScrollControls();
        carousel.addEventListener('scroll', updateScrollControls, {
            passive: true,
        });
        resizeObserver.observe(carousel);

        return () => {
            carousel.removeEventListener('scroll', updateScrollControls);
            resizeObserver.disconnect();
        };
    }, [featuredProducts]);

    const newArrivals = useMemo(() => products.slice(0, 8), [products]);
    const totalInStock = useMemo(
        () =>
            products.reduce(
                (total, product) => total + productAvailableStock(product),
                0,
            ),
        [products],
    );

    function scrollFeaturedProducts(direction: 'previous' | 'next') {
        const carousel = featuredCarouselRef.current;

        if (!carousel) {
            return;
        }

        carousel.scrollBy({
            left:
                direction === 'next'
                    ? carousel.clientWidth * 0.8
                    : -carousel.clientWidth * 0.8,
            behavior: 'smooth',
        });
    }

    return (
        <div className="min-h-screen bg-customer-surface text-customer-primary">
            <CustomerNavbar
                user={user}
                active="home"
                cartCount={cartCount}
                onHomeClick={() => undefined}
                onShopClick={onShopClick}
                onCartClick={onCartClick}
                onOrdersClick={onOrdersClick}
                onMessagesClick={onMessagesClick}
                onLogout={onLogout}
            />

            <main>
                <section className="relative flex min-h-[calc(100vh-88px)] w-full items-center justify-center overflow-hidden border-b border-customer-outline-variant/20 md:min-h-180">
                    <div className="absolute inset-0 z-0">
                        <img
                            className="h-full w-full object-cover"
                            alt="A cinematic editorial fashion photograph of a model in a voluminous architectural silk coat standing against a minimalist concrete wall."
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrk2Eb72IMAmlFq7s0kMlzzxRTK7sBiy1Qoy4v3mfOnAjuNFkOVRz_gQjnqyrZUkoNfFUSu0PoYCfLzb1WJOYHJGrziU4dOP38QFlIarrCj2JeWyTo-tJ7SXR0HktIEsP8gYyvw3_7HgYr6MzqRmzR65NiLYQ1Oq5YoM3EZw74qu2F6RfzOJxyaytsJn8XXRWiHa_uieZeE7JH8jBmvlKCSnpap_MYMa2llZEIov5bPdDyxfNZ1ulu9-pFvCr2OKSNZhT0zBBVjF1o"
                        />
                        <div className="absolute inset-0 bg-customer-primary/5" />
                    </div>
                    <div className="relative z-10 max-w-4xl px-5 text-center md:px-10">
                        <h1 className="mb-6 font-display-lg text-6xl leading-[0.9] tracking-tighter text-customer-primary mix-blend-multiply md:text-[80px]">
                            REFINED <br /> SILHOUETTES
                        </h1>
                        <p className="mx-auto mb-10 max-w-[90%] text-base leading-7 text-customer-primary/80 md:text-lg">
                            Discover the core of the Autumn/Winter collection
                            where architectural precision meets the softness of
                            nature.
                        </p>
                        <button
                            type="button"
                            onClick={onShopClick}
                            className="text-label-caps bg-black px-12 py-5 font-label-caps tracking-widest text-white uppercase transition-all hover:bg-white/50 hover:text-black md:px-16 md:py-6"
                        >
                            Shop The Collection
                        </button>
                    </div>
                </section>

                <section className="grid gap-4 border-b border-customer-outline-variant/20 px-5 py-6 md:grid-cols-4 md:px-10">
                    <MetricCard
                        label="Products"
                        value={String(products.length)}
                        description="Available to shop"
                    />
                    <MetricCard
                        label="Categories"
                        value={String(categories.length)}
                        description="Active collections"
                    />
                    <MetricCard
                        label="Stock"
                        value={String(totalInStock)}
                        description="Items available"
                    />
                    <MetricCard
                        label="Cart"
                        value={String(cartCount)}
                        description="Items selected"
                    />
                </section>

                <section className="grid gap-4 border-b border-customer-outline-variant/20 px-5 py-10 md:grid-cols-3 md:px-10">
                    <QuickAction
                        icon={ShoppingBag}
                        title="Continue shopping"
                        description="Browse products by category and choose variants."
                        onClick={onShopClick}
                    />
                    <QuickAction
                        icon={PackageCheck}
                        title="Order history"
                        description="Review your submitted orders and payment status."
                        onClick={onOrdersClick}
                    />
                    <QuickAction
                        icon={MessageSquareText}
                        title="Message admin"
                        description="Ask about orders, sizing, stock, or payment."
                        onClick={onMessagesClick}
                    />
                </section>

                <section className="border-b border-customer-outline-variant/20 bg-customer-surface-container-low px-5 py-14 md:px-10">
                    <SectionHeader
                        eyebrow="Boutique highlights"
                        title="Featured products"
                        action="View all"
                        onAction={onShopClick}
                    />
                    {loading ? (
                        <LoadingBlock label="Loading featured products" />
                    ) : featuredProducts.length === 0 ? (
                        <EmptyBlock label="No featured products are available." />
                    ) : (
                        <>
                            <div
                                ref={featuredCarouselRef}
                                aria-label="Featured products"
                                className="flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain scroll-smooth [&::-webkit-scrollbar]:hidden"
                            >
                                {featuredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onClick={() =>
                                            onProductClick(product.id)
                                        }
                                        featured
                                    />
                                ))}
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-customer-outline-variant/30 pt-4">
                                <p className="font-label-caps text-[11px] text-customer-secondary tabular-nums">
                                    {String(activeFeaturedProduct + 1).padStart(
                                        2,
                                        '0',
                                    )}{' '}
                                    /{' '}
                                    {String(featuredProducts.length).padStart(
                                        2,
                                        '0',
                                    )}
                                </p>
                                <div className="flex items-center gap-2">
                                    <CarouselButton
                                        label="Previous featured products"
                                        disabled={!canScrollFeaturedLeft}
                                        onClick={() =>
                                            scrollFeaturedProducts('previous')
                                        }
                                    >
                                        <ChevronLeft className="size-5" />
                                    </CarouselButton>
                                    <CarouselButton
                                        label="Next featured products"
                                        disabled={!canScrollFeaturedRight}
                                        onClick={() =>
                                            scrollFeaturedProducts('next')
                                        }
                                    >
                                        <ChevronRight className="size-5" />
                                    </CarouselButton>
                                </div>
                            </div>
                        </>
                    )}
                </section>

                <section className="border-b border-customer-outline-variant/20 px-5 py-14 md:px-10">
                    <SectionHeader
                        eyebrow="Collections"
                        title="Shop by category"
                        action="Open shop"
                        onAction={onShopClick}
                    />
                    {loading ? (
                        <LoadingBlock label="Loading categories" />
                    ) : categories.length === 0 ? (
                        <EmptyBlock label="No active categories are available." />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={onShopClick}
                                    className="border border-customer-outline-variant/20 p-5 text-left transition-colors hover:border-customer-primary"
                                >
                                    <p className="font-headline-md text-2xl">
                                        {categoryDisplayName(category)}
                                    </p>
                                    <p className="mt-2 text-sm text-customer-secondary">
                                        {category.total_products_count ??
                                            category.products_count ??
                                            0}{' '}
                                        products
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section className="px-5 py-14 md:px-10">
                    <SectionHeader
                        eyebrow="Recently added"
                        title="New arrivals"
                        action="Shop all"
                        onAction={onShopClick}
                    />
                    {loading ? (
                        <LoadingBlock label="Loading products" />
                    ) : newArrivals.length === 0 ? (
                        <EmptyBlock label="No products are available." />
                    ) : (
                        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                            {newArrivals.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onClick={() => onProductClick(product.id)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <HomeFooter
                    onShopClick={onShopClick}
                    onCartClick={onCartClick}
                    onOrdersClick={onOrdersClick}
                    onMessagesClick={onMessagesClick}
                />
            </main>
        </div>
    );
}

function HomeFooter({
    onShopClick,
    onCartClick,
    onOrdersClick,
    onMessagesClick,
}: {
    onShopClick: () => void;
    onCartClick: () => void;
    onOrdersClick: () => void;
    onMessagesClick: () => void;
}) {
    return (
        <footer className="grid w-full grid-cols-1 gap-10 border-t border-customer-outline-variant/20 bg-customer-surface-container px-5 py-14 md:grid-cols-4 md:px-10 md:py-16">
            <div className="flex flex-col gap-6">
                <span className="font-display-lg text-4xl tracking-tighter text-customer-primary">
                    ESTHETIQUE
                </span>
                <p className="max-w-sm text-sm leading-6 text-customer-secondary">
                    Crafting the modern wardrobe with refined silhouettes,
                    considered details, and boutique service.
                </p>
            </div>

            <FooterColumn title="Client service">
                <FooterButton onClick={onMessagesClick}>Contact</FooterButton>
                <FooterButton onClick={onOrdersClick}>
                    Order history
                </FooterButton>
                <FooterButton onClick={onCartClick}>Cart</FooterButton>
                <FooterButton onClick={onShopClick}>
                    Size and stock
                </FooterButton>
            </FooterColumn>

            <FooterColumn title="Boutique">
                <FooterButton onClick={onShopClick}>
                    Shop collection
                </FooterButton>
                <FooterButton onClick={onShopClick}>New arrivals</FooterButton>
                <FooterButton onClick={onShopClick}>
                    Featured pieces
                </FooterButton>
                <FooterButton onClick={onMessagesClick}>
                    Style support
                </FooterButton>
            </FooterColumn>

            <div>
                <h4 className="text-label-caps mb-6 font-label-caps text-customer-primary uppercase">
                    Newsletter
                </h4>
                <p className="mb-6 text-sm leading-6 text-customer-secondary">
                    Join for collection updates, boutique notes, and early
                    access.
                </p>
                <form
                    className="flex items-center gap-3 border-b border-customer-outline-variant/40 py-2"
                    onSubmit={(event) => event.preventDefault()}
                >
                    <label className="sr-only" htmlFor="footer-newsletter">
                        Email address
                    </label>
                    <input
                        id="footer-newsletter"
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-customer-secondary"
                        placeholder="Email address"
                        type="email"
                    />
                    <button
                        className="text-label-caps shrink-0 font-label-caps text-customer-primary uppercase transition-opacity hover:opacity-70"
                        type="submit"
                    >
                        Subscribe
                    </button>
                </form>
            </div>

            <div className="flex flex-col gap-5 border-t border-customer-outline-variant/20 pt-6 md:col-span-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-customer-secondary">
                    © 2026 ESTHETIQUE. All rights reserved.
                </p>
                <div className="flex flex-wrap gap-5 text-sm text-customer-secondary">
                    <button
                        type="button"
                        className="transition-colors hover:text-customer-primary"
                    >
                        Privacy
                    </button>
                    <button
                        type="button"
                        className="transition-colors hover:text-customer-primary"
                    >
                        Terms
                    </button>
                    <button
                        type="button"
                        className="transition-colors hover:text-customer-primary"
                        onClick={onMessagesClick}
                    >
                        Support
                    </button>
                </div>
            </div>
        </footer>
    );
}

function FooterColumn({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <h4 className="text-label-caps mb-6 font-label-caps text-customer-primary uppercase">
                {title}
            </h4>
            <div className="flex flex-col items-start gap-4">{children}</div>
        </div>
    );
}

function FooterButton({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className="text-left text-sm text-customer-secondary transition-colors hover:text-customer-primary"
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function SectionHeader({
    eyebrow,
    title,
    action,
    onAction,
}: {
    eyebrow: string;
    title: string;
    action: string;
    onAction: () => void;
}) {
    return (
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                <span className="text-label-caps mb-2 block font-label-caps text-customer-secondary uppercase">
                    {eyebrow}
                </span>
                <h2 className="font-headline-md text-3xl text-customer-primary md:text-4xl">
                    {title}
                </h2>
            </div>
            <button
                type="button"
                onClick={onAction}
                className="text-label-caps w-fit border-b border-customer-primary/30 pb-1 font-label-caps text-customer-primary transition-colors hover:border-customer-primary"
            >
                {action}
            </button>
        </div>
    );
}

function ProductCard({
    product,
    onClick,
    featured = false,
}: {
    product: Product;
    onClick: () => void;
    featured?: boolean;
}) {
    return (
        <button
            type="button"
            data-featured-card={featured ? true : undefined}
            onClick={onClick}
            className={
                featured
                    ? 'group min-w-0 shrink-0 basis-[78%] snap-start overflow-hidden border border-customer-outline-variant/30 bg-customer-surface p-3 text-left shadow-sm transition-colors hover:border-customer-primary sm:basis-64 lg:basis-72'
                    : 'group text-left'
            }
        >
            <div className="relative mb-4 aspect-4/5 overflow-hidden bg-customer-surface-container">
                {featured && (
                    <span className="text-label-caps absolute top-3 left-3 z-10 bg-customer-primary px-3 py-1.5 font-label-caps text-customer-surface uppercase">
                        Featured
                    </span>
                )}
                {primaryProductImage(product) ? (
                    <img
                        src={primaryProductImage(product) ?? ''}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="grid h-full place-items-center">
                        <ImagePlus className="size-8 text-customer-secondary" />
                    </div>
                )}
            </div>
            <div className={featured ? 'px-1 pb-2' : ''}>
                <div className="flex items-center justify-between gap-4">
                    <p className="font-label-caps text-[10px] text-customer-secondary uppercase">
                        {product.category
                            ? categoryDisplayName(product.category)
                            : 'Boutique'}
                    </p>
                    <p className="shrink-0 text-sm font-medium text-customer-primary">
                        {money.format(Number(product.price))}
                    </p>
                </div>
                <h3 className="mt-2 font-headline-md text-xl leading-6 text-customer-primary transition-colors group-hover:text-customer-secondary">
                    {product.name}
                </h3>
            </div>
        </button>
    );
}

function MetricCard({
    label,
    value,
    description,
}: {
    label: string;
    value: string;
    description: string;
}) {
    return (
        <div className="border border-customer-outline-variant/20 p-5">
            <p className="text-label-caps font-label-caps text-customer-secondary uppercase">
                {label}
            </p>
            <p className="mt-2 font-headline-md text-3xl">{value}</p>
            <p className="mt-1 text-sm text-customer-secondary">
                {description}
            </p>
        </div>
    );
}

function QuickAction({
    icon: Icon,
    title,
    description,
    onClick,
}: {
    icon: typeof ShoppingBag;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex gap-4 border border-customer-outline-variant/20 p-5 text-left transition-colors hover:border-customer-primary"
        >
            <Icon className="mt-1 size-5 shrink-0 text-customer-secondary" />
            <div>
                <p className="font-headline-md text-2xl">{title}</p>
                <p className="mt-2 text-sm leading-6 text-customer-secondary">
                    {description}
                </p>
            </div>
        </button>
    );
}

function CarouselButton({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className="grid size-10 place-items-center border border-customer-outline-variant/50 bg-customer-surface text-customer-primary transition-colors hover:border-customer-primary hover:bg-customer-primary hover:text-customer-surface disabled:cursor-not-allowed disabled:opacity-30"
        >
            {children}
        </button>
    );
}

function LoadingBlock({ label }: { label: string }) {
    return (
        <div className="grid min-h-52 place-items-center border border-customer-outline-variant/20 text-sm text-customer-secondary">
            {label}
        </div>
    );
}

function EmptyBlock({ label }: { label: string }) {
    return (
        <div className="grid min-h-52 place-items-center border border-customer-outline-variant/20 text-center text-sm text-customer-secondary">
            {label}
        </div>
    );
}

function productAvailableStock(product: Product): number {
    if (product.variants.length > 0) {
        return product.variants
            .filter((variant) => variant.is_active)
            .reduce((total, variant) => total + variant.stock_quantity, 0);
    }

    return product.stock_quantity;
}

function primaryProductImage(product: Product): string | null {
    return product.images[0]?.url ?? product.image_url;
}
