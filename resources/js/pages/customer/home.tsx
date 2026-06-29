import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react';
import CustomerNavbar from '@/components/customer/customer-navbar';
import { getFeaturedProducts } from '@/api/products';
import { money } from '@/const/data';
import type { Product, User } from '@/types/types';
import { categoryDisplayName } from '@/lib/category';

type Props = {
    user: User;
    cartCount: number;
    onProductClick: (productId: number) => void;
    onShopClick: () => void;
    onCartClick: () => void;
    onLogout: () => void;
};

export default function CustomerHome({
    user,
    cartCount,
    onProductClick,
    onShopClick,
    onCartClick,
    onLogout,
}: Props) {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [loadingFeaturedProducts, setLoadingFeaturedProducts] =
        useState(true);
    const [canScrollFeaturedLeft, setCanScrollFeaturedLeft] = useState(false);
    const [canScrollFeaturedRight, setCanScrollFeaturedRight] = useState(false);
    const [activeFeaturedProduct, setActiveFeaturedProduct] = useState(0);
    const featuredCarouselRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getFeaturedProducts()
            .then((payload) => setFeaturedProducts(payload.data.slice(0, 10)))
            .finally(() => setLoadingFeaturedProducts(false));
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

    useEffect(() => {
        // 1. Intersection Observer Logic
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        const elements = document.querySelectorAll('.reveal-on-scroll');
        elements.forEach((el) => observer.observe(el));

        // 2. Header Scroll Effect
        const handleScroll = () => {
            const header = document.querySelector('header');
            if (!header) return;

            if (window.scrollY > 50) {
                header.classList.add('bg-surface/95', 'backdrop-blur-md');
            } else {
                header.classList.remove('bg-surface/95', 'backdrop-blur-md');
            }
        };

        window.addEventListener('scroll', handleScroll);

        document.title = 'Shop - Boutique';

        return () => {
            elements.forEach((el) => observer.unobserve(el));
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className="text-customer--on-surface bg-customer-surface selection:bg-customer-primary-fixed-dim selection:text-customer-primary">
            <CustomerNavbar
                user={user}
                active="home"
                cartCount={cartCount}
                onHomeClick={() => undefined}
                onShopClick={onShopClick}
                onCartClick={onCartClick}
                onLogout={onLogout}
            />
            {/* <!-- Hero Section --> */}
            <section className="relative flex h-230.25 w-full items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        className="h-full w-full object-cover"
                        data-alt="A cinematic editorial fashion photograph of a model in a voluminous, architectural silk coat standing against a minimalist brutalist concrete wall. The lighting is soft and diffused, creating elegant shadows and highlighting the texture of the garment. The color palette is monochromatic with shades of bone, sand, and deep charcoal. The composition is wide and centered, embodying a sense of quiet luxury and high-end aesthetic."
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrk2Eb72IMAmlFq7s0kMlzzxRTK7sBiy1Qoy4v3mfOnAjuNFkOVRz_gQjnqyrZUkoNfFUSu0PoYCfLzb1WJOYHJGrziU4dOP38QFlIarrCj2JeWyTo-tJ7SXR0HktIEsP8gYyvw3_7HgYr6MzqRmzR65NiLYQ1Oq5YoM3EZw74qu2F6RfzOJxyaytsJn8XXRWiHa_uieZeE7JH8jBmvlKCSnpap_MYMa2llZEIov5bPdDyxfNZ1ulu9-pFvCr2OKSNZhT0zBBVjF1o"
                    />
                    <div className="absolute inset-0 bg-primary/5"></div>
                </div>
                <div className="px-container-margin relative z-10 max-w-4xl text-center">
                    <h1 className="reveal-on-scroll mb-6 font-display-lg text-[80px] leading-[0.9] tracking-tighter text-customer-primary mix-blend-multiply">
                        REFINED <br /> SILHOUETTES
                    </h1>
                    <p
                        className="text-body-lg reveal-on-scroll mx-auto mb-10 max-w-[90%] font-body-lg text-customer-primary/80"
                        style={{ transitionDelay: '200ms' }}
                    >
                        Discover the core of the Autumn/Winter collection—where
                        architectural precision meets the softness of nature.
                    </p>
                    <div
                        className="gap-md reveal-on-scroll flex flex-col justify-center md:flex-row"
                        style={{ transitionDelay: '400ms' }}
                    >
                        <button
                            type="button"
                            onClick={onShopClick}
                            className="text-label-caps bg-black px-16 py-6 font-label-caps tracking-widest text-white uppercase transition-all hover:bg-white/50 hover:text-black"
                        >
                            Shop The Collection
                        </button>
                    </div>
                </div>
            </section>
            {/* <!-- Featured products -->  */}
            <section className="border-y border-customer-outline-variant/20 bg-customer-surface-container-low px-5 py-14 md:px-10 md:py-20">
                <div className="mx-auto">
                    <div className="mb-9 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-xl">
                            <span className="text-label-caps mb-2 block font-label-caps text-customer-secondary uppercase">
                                Boutique Highlights
                            </span>
                            <h2 className="font-headline-md text-3xl text-customer-primary md:text-4xl">
                                Featured Products
                            </h2>
                            <p className="mt-3 max-w-lg text-sm leading-6 text-customer-secondary">
                                A considered edit of signature pieces selected
                                for the season.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onShopClick}
                            className="text-label-caps w-fit border-b border-customer-primary/30 pb-1 font-label-caps text-customer-primary transition-colors hover:border-customer-primary"
                        >
                            View All Products
                        </button>
                    </div>
                    {loadingFeaturedProducts ? (
                        <div className="grid min-h-80 place-items-center text-sm text-customer-secondary">
                            Loading featured products
                        </div>
                    ) : featuredProducts.length === 0 ? (
                        <div className="grid min-h-64 place-items-center border-y border-customer-outline-variant/20 text-sm text-customer-secondary">
                            No featured products are currently available.
                        </div>
                    ) : (
                        <>
                            <div
                                ref={featuredCarouselRef}
                                aria-label="Featured products"
                                className="flex snap-x snap-mandatory scrollbar-none gap-6 overflow-x-auto overscroll-x-contain scroll-smooth [&::-webkit-scrollbar]:hidden"
                            >
                                {featuredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        data-featured-card
                                        className="group min-w-0 shrink-0 basis-[78%] snap-start overflow-hidden rounded-2xl border border-gray-300 bg-customer-surface p-3 text-left shadow-sm transition-colors hover:border-customer-primary/60 focus-visible:border-customer-primary focus-visible:outline-none sm:basis-64 lg:basis-70"
                                        onClick={() =>
                                            onProductClick(product.id)
                                        }
                                    >
                                        <div className="relative aspect-4/5 overflow-hidden bg-customer-surface-container">
                                            <span className="text-label-caps absolute top-3 left-3 z-10 bg-customer-primary px-3 py-1.5 font-label-caps text-customer-surface uppercase">
                                                Featured
                                            </span>
                                            {primaryProductImage(product) ? (
                                                <img
                                                    src={
                                                        primaryProductImage(
                                                            product,
                                                        ) ?? undefined
                                                    }
                                                    alt={product.name}
                                                    className="h-full w-full rounded-2xl object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="grid h-full place-items-center">
                                                    <ImagePlus className="size-8 text-customer-secondary" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-h-32 p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="font-label-caps text-[10px] text-customer-secondary uppercase">
                                                    {product.category
                                                        ? categoryDisplayName(
                                                              product.category,
                                                          )
                                                        : 'Boutique'}
                                                </p>
                                                <p className="shrink-0 text-sm font-medium text-customer-primary">
                                                    {money.format(
                                                        Number(product.price),
                                                    )}
                                                </p>
                                            </div>
                                            <h3 className="mt-3 font-headline-md text-xl leading-6 text-customer-primary transition-colors group-hover:text-customer-secondary">
                                                {product.name}
                                            </h3>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-customer-outline-variant/30 pt-4">
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
                                    <button
                                        type="button"
                                        title="Previous featured products"
                                        aria-label="Previous featured products"
                                        disabled={!canScrollFeaturedLeft}
                                        onClick={() =>
                                            scrollFeaturedProducts('previous')
                                        }
                                        className="grid size-10 place-items-center border border-customer-outline-variant/50 bg-customer-surface text-customer-primary transition-colors hover:border-customer-primary hover:bg-customer-primary hover:text-customer-surface disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        <ChevronLeft className="size-5" />
                                    </button>
                                    <button
                                        type="button"
                                        title="Next featured products"
                                        aria-label="Next featured products"
                                        disabled={!canScrollFeaturedRight}
                                        onClick={() =>
                                            scrollFeaturedProducts('next')
                                        }
                                        className="grid size-10 place-items-center border border-customer-outline-variant/50 bg-customer-surface text-customer-primary transition-colors hover:border-customer-primary hover:bg-customer-primary hover:text-customer-surface disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        <ChevronRight className="size-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>
            {/* <!-- Conscious Craftsmanship Section --> */}
            <section className="flex flex-col items-center bg-customer-surface-container-low px-10 py-16 text-center">
                <div className="reveal-on-scroll max-w-3xl">
                    <span className="text-label-caps mb-6 block font-label-caps text-customer-secondary uppercase">
                        Our Philosophy
                    </span>
                    <h2 className="text-headline-md mb-10 font-headline-md leading-snug text-customer-primary">
                        Conscious Craftsmanship: <br />A commitment to longevity
                        and the art of making.
                    </h2>
                    <p className="text-body-lg mb-16 font-body-lg leading-relaxed text-customer-secondary">
                        At ESTHÉTIQUE, we believe luxury should not come at the
                        cost of the planet. Every silhouette is thoughtfully
                        designed in our Paris studio and handcrafted by master
                        artisans using only ethically sourced, renewable
                        materials. We create for the long term, avoiding trends
                        in favor of timeless endurance.
                    </p>
                    <div className="grid grid-cols-1 gap-10 border-t border-customer-outline-variant/30 pt-10 md:grid-cols-3">
                        <div>
                            <span className="text-headline-md mb-2 block font-headline-md text-customer-primary">
                                01
                            </span>
                            <h4 className="text-label-caps mb-2 font-label-caps text-customer-primary uppercase">
                                Traceable
                            </h4>
                            <p className="text-body-md font-body-md text-customer-secondary">
                                Full transparency from fiber to final stitch.
                            </p>
                        </div>
                        <div>
                            <span className="text-headline-md mb-2 block font-headline-md text-customer-primary">
                                02
                            </span>
                            <h4 className="text-label-caps mb-2 font-label-caps text-customer-primary uppercase">
                                Artisanal
                            </h4>
                            <p className="text-body-md font-body-md text-customer-secondary">
                                Handmade in small batches by local masters.
                            </p>
                        </div>
                        <div>
                            <span className="text-headline-md mb-2 block font-headline-md text-customer-primary">
                                03
                            </span>
                            <h4 className="text-label-caps mb-2 font-label-caps text-customer-primary uppercase">
                                Timeless
                            </h4>
                            <p className="text-body-md font-body-md text-customer-secondary">
                                Designed to be cherished for generations.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            {/* <!-- Journal Preview --> */}
            <section className="bg-customer-surface px-10 py-16">
                <div className="mx-auto mb-10 flex max-w-screen-2xl items-end justify-between">
                    <div>
                        <span className="text-label-caps mb-2 block font-label-caps text-customer-secondary uppercase">
                            The Journal
                        </span>
                        <h2 className="text-headline-md font-headline-md text-customer-primary">
                            In Conversation
                        </h2>
                    </div>
                    <a
                        className="text-label-caps border-b border-customer-primary/20 pb-1 font-label-caps text-customer-primary transition-all hover:border-customer-primary"
                        href="#"
                    >
                        Read Journal
                    </a>
                </div>
                <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-10 md:grid-cols-3">
                    {/* <!-- Article 1 --> */}
                    <div className="group reveal-on-scroll cursor-pointer">
                        <div className="relative mb-6 aspect-square overflow-hidden bg-customer-surface-container">
                            <img
                                className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                                data-alt="An artistic black and white portrait of a woman looking through a large window into a minimalist garden. The scene is peaceful and reflective, with dramatic natural lighting and strong vertical lines from the window frames. The mood is quiet and intellectual, perfectly representing an editorial journal piece about lifestyle and mindfulness."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWU3FadHgQsLyjSdlEhj_iEwWvuDFEc1bgwg7cjtfu7CjalW1jo5N7z-niZhjadJ_O96zmEcgbCRMiVxAV8sa3VnC36HnJf9iVEG35Tu6fn1_j3j-lz_ji77weD2pBw0jHFPCeWbLrjBXIuxHzKriSiHBk8j9Gnoh1fUgEFNg_CUcHNbZkd4rTg9gkY_kBPqMDY86cXRcjSNoSe-E-pZYyCVp5DlpGv-Qzw69eddw9vHHZiiyGhGkuuDnkEAAU8fI0HOCjmuyWcVir"
                            />
                        </div>
                        <span className="mb-2 block font-label-caps text-[10px] text-customer-secondary uppercase">
                            Volume 12 — Editorial
                        </span>
                        <h3 className="text-headline-md mb-4 font-headline-md text-[24px] decoration-1 underline-offset-4 group-hover:underline">
                            The Architecture of Silence
                        </h3>
                        <p className="text-body-md line-clamp-2 font-body-md text-customer-secondary">
                            Exploring the connection between minimalist
                            architecture and the modern wardrobe's evolving
                            silhouette.
                        </p>
                    </div>
                    {/* <!-- Article 2 --> */}
                    <div
                        className="group reveal-on-scroll cursor-pointer"
                        style={{ transitionDelay: '200ms' }}
                    >
                        <div className="relative mb-6 aspect-square overflow-hidden bg-customer-surface-container">
                            <img
                                className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                                data-alt="A detailed macro shot of raw linen fibers and weaving tools on a rustic wooden table. The lighting is low and moody, highlighting the natural imperfections and textures of the raw materials. This editorial image conveys the authentic, tactile process of craftsmanship and material sourcing for high-end sustainable fashion."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY7dWqA8pJaCSt7aKgoHnV2A7RyHKa6H80XbJTzK8s1w-GeTQ7m4IxYxSUoPEfEcLp6qaVczAynPD6qj8T4UhFjN0heVDfsiaf433HZWAv7341PSSCw1dx4-HJHovos-4IlGssvfNGC4AzCosgGixhhOq1OGIBGkFtjVIIw_TyFacFMmwxanXLyeLMEibunNVNnhoZ7DlSg2FW0D4jWmSWQVSKm13ex3sXVUzegFGIfp5waZprakE8Qi5GTWAxhA6LMRB6hcoo_Xrv"
                            />
                        </div>
                        <span className="mb-2 block font-label-caps text-[10px] text-customer-secondary uppercase">
                            Volume 11 — Process
                        </span>
                        <h3 className="text-headline-md mb-4 font-headline-md text-[24px] decoration-1 underline-offset-4 group-hover:underline">
                            Of Earth and Loom
                        </h3>
                        <p className="text-body-md line-clamp-2 font-body-md text-customer-secondary">
                            A deep dive into our partnership with linen farmers
                            in the Normandy region and the preservation of
                            ancient weaving techniques.
                        </p>
                    </div>
                    {/* <!-- Article 3 --> */}
                    <div
                        className="group reveal-on-scroll cursor-pointer"
                        style={{ transitionDelay: '400ms' }}
                    >
                        <div className="relative mb-6 aspect-square overflow-hidden bg-customer-surface-container">
                            <img
                                className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                                data-alt="A wide, minimalist landscape shot of a modern architectural home nestled in a foggy mountain range. The house features clean glass lines and dark steel frames, contrasting with the soft, ethereal fog. This image represents the 'Esthetique' brand's focus on quiet luxury, modernism, and harmony with nature, serving as an atmospheric journal cover."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAKkfTyFFyCzIQkN1vN00VU8J23NLR8Vud2MU2UHMVuxKTuyCLFt_qt6p8SI-8XaC2zlJeKjazpzS4FUoxB-uXHJ1YLv-4Lc9sPTh7vkvYp3Lwgcgg0TmkY6lj4AYinGkREKgLdAP7WzNslaxmylS3bs8yRNyFYPQv7gLUOCKgpWcUyvhssLgsh81V_uORixWvxyaoXihnJm94X-0WHB7Pk4f3MQsAb--ZNCxuhFb5pIlCtv4v8gAjLtl2bQA1RtvsyAQtgU0F2tnD"
                            />
                        </div>
                        <span className="mb-2 block font-label-caps text-[10px] text-customer-secondary uppercase">
                            Volume 10 — Spaces
                        </span>
                        <h3 className="text-headline-md mb-4 font-headline-md text-[24px] decoration-1 underline-offset-4 group-hover:underline">
                            Retreat: The Alpenglow House
                        </h3>
                        <p className="text-body-md line-clamp-2 font-body-md text-customer-secondary">
                            We visit the secluded mountain atelier of architect
                            Elena Rossi to discuss space, light, and the
                            importance of stillness.
                        </p>
                    </div>
                </div>
            </section>
            {/* <!-- Footer --> */}
            <footer className="grid w-full grid-cols-1 gap-10 bg-customer-surface-container px-10 py-16 md:grid-cols-4">
                <div className="flex flex-col gap-6">
                    <span className="text-display-lg font-display-lg text-customer-primary">
                        ESTHÉTIQUE
                    </span>
                    <p className="text-body-md max-w-[90%] font-body-md text-customer-secondary">
                        Crafting the modern wardrobe with a focus on refined
                        silhouettes, sustainable practices, and artisanal
                        quality.
                    </p>
                </div>
                <div>
                    <h4 className="text-label-caps mb-6 font-label-caps text-customer-primary uppercase">
                        Client Service
                    </h4>
                    <ul className="flex flex-col gap-4">
                        <li>
                            <a
                                className="text-body-md font-body-md text-customer-secondary transition-colors hover:text-customer-primary"
                                href="#"
                            >
                                Contact
                            </a>
                        </li>
                        <li>
                            <a
                                className="text-body-md font-body-md text-customer-secondary transition-colors hover:text-customer-primary"
                                href="#"
                            >
                                Shipping & Returns
                            </a>
                        </li>
                        <li>
                            <a
                                className="text-body-md font-body-md text-customer-secondary transition-colors hover:text-customer-primary"
                                href="#"
                            >
                                Size Guide
                            </a>
                        </li>
                        <li>
                            <a
                                className="text-body-md font-body-md text-customer-secondary transition-colors hover:text-customer-primary"
                                href="#"
                            >
                                Store Locator
                            </a>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-label-caps mb-6 font-label-caps text-customer-primary uppercase">
                        Legal
                    </h4>
                    <ul className="flex flex-col gap-4">
                        <li>
                            <a
                                className="text-body-md font-body-md text-customer-secondary transition-colors hover:text-customer-primary"
                                href="#"
                            >
                                Privacy Policy
                            </a>
                        </li>
                        <li>
                            <a
                                className="text-body-md font-body-md text-customer-secondary transition-colors hover:text-customer-primary"
                                href="#"
                            >
                                Terms of Service
                            </a>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-label-caps mb-6 font-label-caps text-customer-primary uppercase">
                        Newsletter
                    </h4>
                    <p className="text-body-md mb-6 font-body-md text-customer-secondary">
                        Join for exclusive early access and stories from the
                        journal.
                    </p>
                    <form className="border-outline flex items-center border-b py-2">
                        <input
                            className="text-body-md w-full border-none bg-transparent px-0 font-body-md focus:ring-0"
                            placeholder="Email address"
                            type="email"
                        />
                        <button
                            className="text-label-caps font-label-caps tracking-widest text-customer-primary uppercase transition-opacity hover:opacity-70"
                            type="submit"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>
                <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-customer-outline-variant/20 pt-6 md:col-span-4 md:flex-row">
                    <p className="text-body-md font-body-md text-customer-secondary">
                        © 2024 ESTHÉTIQUE. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a
                            className="text-customer-secondary transition-colors hover:text-customer-primary"
                            href="#"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                public
                            </span>
                        </a>
                        <a
                            className="text-customer-secondary transition-colors hover:text-customer-primary"
                            href="#"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                mail
                            </span>
                        </a>
                        <a
                            className="text-customer-secondary transition-colors hover:text-customer-primary"
                            href="#"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                share
                            </span>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function primaryProductImage(product: Product): string | null {
    return product.images[0]?.url ?? product.image_url;
}

{
    /* <script>
        // Simple Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));

        // Smooth header scroll effect
        let lastScroll = 0;
        const header = document.querySelector('header');
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 50) {
                header.classList.add('bg-surface/95', 'backdrop-blur-md');
            } else {
                header.classList.remove('bg-surface/95', 'backdrop-blur-md');
            }
            lastScroll = currentScroll;
        });
    </script> */
}

// <div className="min-h-screen bg-background text-foreground">
//     <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
//         <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
//             <div className="flex items-center gap-3">
//                 <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
//                     <ShoppingBag className="size-5" />
//                 </div>
//                 <div>
//                     <div className="font-semibold">Boutique Shop</div>
//                     <div className="text-xs text-muted-foreground">Welcome, {user.name}</div>
//                 </div>
//             </div>
//             <Button variant="outline" onClick={logout}>
//                 <LogOut className="size-4" />
//                 Logout
//             </Button>
//         </div>
//     </header>

//     <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
//         <section>
//             <h1 className="text-2xl font-semibold tracking-normal">New arrivals</h1>
//             <p className="text-sm text-muted-foreground">
//                 Browse active boutique products from the customer site.
//             </p>
//         </section>

//         {loading ? (
//             <div className="grid min-h-60 place-items-center text-sm text-muted-foreground">
//                 Loading products
//             </div>
//         ) : (
//             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//                 {products.map((product) => (
//                     <Card key={product.id} className="rounded-lg">
//                         <CardHeader>
//                             <div className="flex items-start justify-between gap-3">
//                                 <div>
//                                     <CardTitle>{product.name}</CardTitle>
//                                     <CardDescription>
//                                         {product.category?.name ?? 'Boutique item'}
//                                     </CardDescription>
//                                 </div>
//                                 {product.is_featured && <Badge>Featured</Badge>}
//                             </div>
//                         </CardHeader>
//                         <CardContent className="space-y-4">
//                             <p className="min-h-12 text-sm text-muted-foreground">
//                                 {product.description ?? 'Curated boutique piece ready for your wardrobe.'}
//                             </p>
//                             <div className="flex items-center justify-between">
//                                 <div className="text-lg font-semibold">{money.format(product.price)}</div>
//                                 <Badge variant={product.stock_quantity > 0 ? 'secondary' : 'destructive'}>
//                                     {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Sold out'}
//                                 </Badge>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 ))}
//             </div>
//         )}
//     </main>
// </div>
{
    /* bg-surface text-on-surface selection:bg-primary-fixed-dim selection:text-primary */
}
