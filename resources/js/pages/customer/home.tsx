import { useEffect, useState } from 'react';
import { LogOut, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Paginated, Product, User } from '@/types/types';
import { getJson } from '@/const/json-tanfer';
import { csrfToken, money } from '@/const/data';

type Props = {
    user: User;
    onLogout: () => void;
};

export default function CustomerHome({ user, onLogout }: Props) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

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

        getJson<Paginated<Product>>('/api/v1/products')
            .then((payload) =>
                setProducts(
                    payload.data.filter((product) => product.is_active),
                ),
            )
            .finally(() => setLoading(false));

        // Cleanup function to remove listeners/observers
        return () => {
            elements.forEach((el) => observer.unobserve(el));
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

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
        <div className='bg-customer-surface text-customer--on-surface selection:bg-customer-primary-fixed-dim selection:text-customer-primary'>
            {/* <!-- Top Navigation Bar --> */}
            <header className="bg-customer-surface border-customer-outline-variant/10 px-10 py-6 sticky top-0 z-50 flex w-full max-w-full items-center justify-between border-b">
                <div className="gap-10 flex items-center">
                    <span className="font-display-lg text-display-lg tracking-tighter text-customer-primary">
                        ESTHÉTIQUE
                    </span>
                    <nav className="gap-6 hidden items-center md:flex">
                        <a
                            className="font-label-caps text-label-caps border-b border-customer-primary pb-1 font-bold text-customer-primary"
                            href="#"
                        >
                            Collections
                        </a>
                        <a
                            className="font-label-caps text-label-caps text-customer-secondary transition-colors duration-300 hover:text-customer-primary"
                            href="#"
                        >
                            New Arrivals
                        </a>
                        <a
                            className="font-label-caps text-label-caps text-customer-secondary transition-colors duration-300 hover:text-customer-primary"
                            href="#"
                        >
                            Essentials
                        </a>
                        <a
                            className="font-label-caps text-label-caps text-customer-secondary transition-colors duration-300 hover:text-customer-primary"
                            href="#"
                        >
                            Sustainability
                        </a>
                        <a
                            className="font-label-caps text-label-caps text-customer-secondary transition-colors duration-300 hover:text-customer-primary"
                            href="#"
                        >
                            Journal
                        </a>
                    </nav>
                </div>
                <div className="gap-6 flex items-center">
                    <button className="cursor-pointer transition-opacity hover:opacity-70">
                        <span className="material-symbols-outlined text-customer-primary">
                            search
                        </span>
                    </button>
                    <button className="cursor-pointer transition-opacity hover:opacity-70">
                        <span className="material-symbols-outlined text-customer-primary">
                            shopping_bag
                        </span>
                    </button>
                    <button className="cursor-pointer transition-opacity hover:opacity-70">
                        <span className="material-symbols-outlined text-customerprimary">
                            person
                        </span>
                    </button>
                </div>
            </header>
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
                    <h1 className="font-display-lg mb-6 reveal-on-scroll text-[80px] leading-[0.9] tracking-tighter text-customer-primary mix-blend-multiply">
                        REFINED <br /> SILHOUETTES
                    </h1>
                    <p
                        className="font-body-lg text-body-lg mb-10 reveal-on-scroll mx-auto max-w-[90%] text-customer-primary/80"
                        style={{ transitionDelay: '200ms' }}
                    >
                        Discover the core of the Autumn/Winter collection—where
                        architectural precision meets the softness of nature.
                    </p>
                    <div
                        className="gap-md reveal-on-scroll flex flex-col justify-center md:flex-row"
                        style={{ transitionDelay: '400ms' }}
                    >
                        <button className="px-16 py-6 text-white font-label-caps text-label-caps bg-black tracking-widest uppercase transition-all hover:bg-white/50 hover:text-black">
                            Shop The Collection
                        </button>
                    </div>
                </div>
            </section>
            {/* <!-- Trending Now / Bento Grid -->  */}
            <section className="py-16 px-10 bg-customer-surface mx-auto max-w-screen-2xl">
                <div className="mb-10 flex flex-col items-end justify-between md:flex-row">
                    <div>
                        <span className="font-label-caps text-label-caps mb-2 block text-customer-secondary uppercase">
                            Season Selects
                        </span>
                        <h2 className="font-headline-md text-headline-md text-customer-primary">
                            Trending Now
                        </h2>
                    </div>
                    <a
                        className="font-label-caps text-label-caps border-b border-customer-primary/20 pb-1 text-customer-primary transition-all hover:border-customer-primary"
                        href="#"
                    >
                        View All Products
                    </a>
                </div>
                <div className="gap-6 grid grid-cols-1 md:grid-cols-12">
                    {/* <!-- Large Feature Card --> */}
                    <div className="group reveal-on-scroll cursor-pointer md:col-span-7">
                        <div className="bg-customer-surface-container mb-4 aspect-4/5 overflow-hidden">
                            <img
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                data-alt="A minimalist product shot of a high-end tailored wool blazer in a soft taupe color, draped over a sculptural wooden chair. The background is a clean white studio with soft natural light streaming from the side. The mood is sophisticated and calm, focusing on the quality of the fabric and the precision of the stitching. The image reflects an editorial, quiet luxury style."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuARR813YH_H9j5IvwYG8L_3qlGdxalMq6cqEZ0lyt-VtWQGLCCy8JGGu4cPVnI9ozAtuzA14Oj-DDllRQfeBaF87TOS7AcKE2RCZHcaW-luMSWPT3LSU6RpKQY2QrkMBUr9VUGgiTN6NbGQ5QJg0OoIe-QQiGttk6cLGPjJobY9DnhO84l5ufgklP6u3F-B8Mrq4EwBOOoJuzcndspGhrQ5HW_3_0b1PRA8Fq4SR9ip442FF4U6Hg3_c8YTm3rWZKz85flpDWWNuM4D"
                            />
                        </div>
                        <h3 className="font-headline-md text-[20px] text-customer-primary">
                            Sculpted Wool Blazer
                        </h3>
                        <p className="font-body-md text-body-md text-customer-secondary">
                            $1,250
                        </p>
                    </div>
                    {/* <!-- Side Cards Column --> */}
                    <div className="gap-6 flex flex-col md:col-span-5">
                        <div
                            className="group reveal-on-scroll cursor-pointer"
                            style={{ transitionDelay: '200ms' }}
                        >
                            <div className="bg-customer-surface-container mb-4 aspect-4/3 overflow-hidden">
                                <img
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    data-alt="Close-up of premium leather accessories including a structured handbag and sleek loafers in rich chocolate brown. The items are arranged artfully on a marble plinth with a single botanical leaf casting a subtle shadow. The lighting is high-key and elegant, showcasing the fine grain of the leather. The overall aesthetic is one of refined craftsmanship and luxury."
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQPF8ZVhHXtSkT9eqMe1Z7cXFiE4a5Rn5zHvlbZfPmRRF_rcfUOHMxKi_sPr9q4MQD9LhkAFpUcHOObPSxc7wOq73K4ND5GRvwzjECa--OTi-T1kZiEEGFqeNJe4JjeMTMLPMXXCxhhM2IWv0yGdeNzUgzx_uEqNZaikHNpxI8Dve8JXaJ0zyDSNCncolewnw96w8cTsnD6EOfhl8eFyPsNZ4LpsIkIfFIFNdBtSdBJ0FxNkfS2kWM5QhbdwwjtIH20SNI3NMqUHwG"
                                />
                            </div>
                            <div className="flex items-start justify-between">
                                <h3 className="font-headline-md text-[20px] text-customer-primary">
                                    Fine Grain Loafers
                                </h3>
                                <p className="font-body-md text-body-md text-customer-secondary">
                                    $680
                                </p>
                            </div>
                        </div>
                        <div
                            className="group reveal-on-scroll cursor-pointer"
                            style={{ transitionDelay: '400ms' }}
                        >
                            <div className="bg-customer-surface-container mb-4 aspect-4/3 overflow-hidden">
                                <img
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    data-alt="A beautifully draped cashmere scarf in a neutral oyster shade, flowing elegantly against a backdrop of soft fabric folds. The lighting is warm and golden-hour inspired, emphasizing the softness and luxury of the material. The image captures the essence of tactile luxury and minimalist design. The color palette consists of cream, ivory, and soft beige."
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa20hib0HmRRBWYvWyVSauapOhY9Z98S6FiKGGZrmOG755vSSW7ShPp7rWkudlms05Jr9w4sHuCwaVxwcxW4i6YAfV5E0FFXnxLLEq5Axg2E--fHl5QFEpobWgWXMG525W_MXvQ8OPAeKlP_AWSA8xQcwxYkVuNGk6PFUXg0bFn2BV72LrNfP4eKn6JVZaaVJ5_ucEybH0S5AJJkmx3wbvQkSdxjj2aJ5lf9iP2n3o6uEehfgvdQnblEGKwq5zplJynGLOFu5XQyo8"
                                />
                            </div>
                            <div className="flex items-start justify-between">
                                <h3 className="font-headline-md text-[20px] text-primary">
                                    Pure Cashmere Wrap
                                </h3>
                                <p className="font-body-md text-body-md text-customer-secondary">
                                    $450
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* <!-- Conscious Craftsmanship Section --> */}
            <section className="py-16 bg-customer-surface-container-low px-10 flex flex-col items-center text-center">
                <div className="reveal-on-scroll max-w-3xl">
                    <span className="font-label-caps text-label-caps mb-6 block text-customer-secondary uppercase">
                        Our Philosophy
                    </span>
                    <h2 className="font-headline-md text-headline-md mb-10 leading-snug text-customer-primary">
                        Conscious Craftsmanship: <br />A commitment to longevity
                        and the art of making.
                    </h2>
                    <p className="font-body-lg text-body-lg mb-16 leading-relaxed text-customer-secondary">
                        At ESTHÉTIQUE, we believe luxury should not come at the
                        cost of the planet. Every silhouette is thoughtfully
                        designed in our Paris studio and handcrafted by master
                        artisans using only ethically sourced, renewable
                        materials. We create for the long term, avoiding trends
                        in favor of timeless endurance.
                    </p>
                    <div className="gap-10 border-customer-outline-variant/30 pt-10 grid grid-cols-1 border-t md:grid-cols-3">
                        <div>
                            <span className="font-headline-md text-headline-md mb-2 block text-customer-primary">
                                01
                            </span>
                            <h4 className="font-label-caps text-label-caps mb-2 text-customer-primary uppercase">
                                Traceable
                            </h4>
                            <p className="font-body-md text-body-md text-customer-secondary">
                                Full transparency from fiber to final stitch.
                            </p>
                        </div>
                        <div>
                            <span className="font-headline-md text-headline-md mb-2 block text-customer-primary">
                                02
                            </span>
                            <h4 className="font-label-caps text-label-caps mb-2 text-customer-primary uppercase">
                                Artisanal
                            </h4>
                            <p className="font-body-md text-body-md text-customer-secondary">
                                Handmade in small batches by local masters.
                            </p>
                        </div>
                        <div>
                            <span className="font-headline-md text-headline-md mb-2 block text-customer-primary">
                                03
                            </span>
                            <h4 className="font-label-caps text-label-caps mb-2 text-customer-primary uppercase">
                                Timeless
                            </h4>
                            <p className="font-body-md text-body-md text-customer-secondary">
                                Designed to be cherished for generations.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            {/* <!-- Journal Preview --> */}
            <section className="py-16 px-10 bg-customer-surface">
                <div className="mb-10 mx-auto flex max-w-screen-2xl items-end justify-between">
                    <div>
                        <span className="font-label-caps text-label-caps mb-2 block text-customer-secondary uppercase">
                            The Journal
                        </span>
                        <h2 className="font-headline-md text-headline-md text-customer-primary">
                            In Conversation
                        </h2>
                    </div>
                    <a
                        className="font-label-caps text-label-caps border-b border-customer-primary/20 pb-1 text-customer-primary transition-all hover:border-customer-primary"
                        href="#"
                    >
                        Read Journal
                    </a>
                </div>
                <div className="gap-10 mx-auto grid max-w-screen-2xl grid-cols-1 md:grid-cols-3">
                    {/* <!-- Article 1 --> */}
                    <div className="group reveal-on-scroll cursor-pointer">
                        <div className="bg-customer-surface-container mb-6 relative aspect-square overflow-hidden">
                            <img
                                className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                                data-alt="An artistic black and white portrait of a woman looking through a large window into a minimalist garden. The scene is peaceful and reflective, with dramatic natural lighting and strong vertical lines from the window frames. The mood is quiet and intellectual, perfectly representing an editorial journal piece about lifestyle and mindfulness."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWU3FadHgQsLyjSdlEhj_iEwWvuDFEc1bgwg7cjtfu7CjalW1jo5N7z-niZhjadJ_O96zmEcgbCRMiVxAV8sa3VnC36HnJf9iVEG35Tu6fn1_j3j-lz_ji77weD2pBw0jHFPCeWbLrjBXIuxHzKriSiHBk8j9Gnoh1fUgEFNg_CUcHNbZkd4rTg9gkY_kBPqMDY86cXRcjSNoSe-E-pZYyCVp5DlpGv-Qzw69eddw9vHHZiiyGhGkuuDnkEAAU8fI0HOCjmuyWcVir"
                            />
                        </div>
                        <span className="font-label-caps mb-2 block text-[10px] text-customer-secondary uppercase">
                            Volume 12 — Editorial
                        </span>
                        <h3 className="font-headline-md text-headline-md mb-4 text-[24px] decoration-1 underline-offset-4 group-hover:underline">
                            The Architecture of Silence
                        </h3>
                        <p className="font-body-md text-body-md line-clamp-2 text-customer-secondary">
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
                        <div className="bg-customer-surface-container mb-6 relative aspect-square overflow-hidden">
                            <img
                                className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                                data-alt="A detailed macro shot of raw linen fibers and weaving tools on a rustic wooden table. The lighting is low and moody, highlighting the natural imperfections and textures of the raw materials. This editorial image conveys the authentic, tactile process of craftsmanship and material sourcing for high-end sustainable fashion."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY7dWqA8pJaCSt7aKgoHnV2A7RyHKa6H80XbJTzK8s1w-GeTQ7m4IxYxSUoPEfEcLp6qaVczAynPD6qj8T4UhFjN0heVDfsiaf433HZWAv7341PSSCw1dx4-HJHovos-4IlGssvfNGC4AzCosgGixhhOq1OGIBGkFtjVIIw_TyFacFMmwxanXLyeLMEibunNVNnhoZ7DlSg2FW0D4jWmSWQVSKm13ex3sXVUzegFGIfp5waZprakE8Qi5GTWAxhA6LMRB6hcoo_Xrv"
                            />
                        </div>
                        <span className="font-label-caps mb-2 block text-[10px] text-customer-secondary uppercase">
                            Volume 11 — Process
                        </span>
                        <h3 className="font-headline-md text-headline-md mb-4 text-[24px] decoration-1 underline-offset-4 group-hover:underline">
                            Of Earth and Loom
                        </h3>
                        <p className="font-body-md text-body-md line-clamp-2 text-customer-secondary">
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
                        <div className="bg-customer-surface-container mb-6 relative aspect-square overflow-hidden">
                            <img
                                className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                                data-alt="A wide, minimalist landscape shot of a modern architectural home nestled in a foggy mountain range. The house features clean glass lines and dark steel frames, contrasting with the soft, ethereal fog. This image represents the 'Esthetique' brand's focus on quiet luxury, modernism, and harmony with nature, serving as an atmospheric journal cover."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAKkfTyFFyCzIQkN1vN00VU8J23NLR8Vud2MU2UHMVuxKTuyCLFt_qt6p8SI-8XaC2zlJeKjazpzS4FUoxB-uXHJ1YLv-4Lc9sPTh7vkvYp3Lwgcgg0TmkY6lj4AYinGkREKgLdAP7WzNslaxmylS3bs8yRNyFYPQv7gLUOCKgpWcUyvhssLgsh81V_uORixWvxyaoXihnJm94X-0WHB7Pk4f3MQsAb--ZNCxuhFb5pIlCtv4v8gAjLtl2bQA1RtvsyAQtgU0F2tnD"
                            />
                        </div>
                        <span className="font-label-caps mb-2 block text-[10px] text-customer-secondary uppercase">
                            Volume 10 — Spaces
                        </span>
                        <h3 className="font-headline-md text-headline-md mb-4 text-[24px] decoration-1 underline-offset-4 group-hover:underline">
                            Retreat: The Alpenglow House
                        </h3>
                        <p className="font-body-md text-body-md line-clamp-2 text-customer-secondary">
                            We visit the secluded mountain atelier of architect
                            Elena Rossi to discuss space, light, and the
                            importance of stillness.
                        </p>
                    </div>
                </div>
            </section>
            {/* <!-- Footer --> */}
            <footer className="w-full bg-customer-surface-container grid grid-cols-1 md:grid-cols-4 gap-10 px-10 py-16">
                <div className="gap-6 flex flex-col">
                    <span className="font-display-lg text-display-lg text-customer-primary">
                        ESTHÉTIQUE
                    </span>
                    <p className="font-body-md text-body-md max-w-[90%] text-customer-secondary">
                        Crafting the modern wardrobe with a focus on refined
                        silhouettes, sustainable practices, and artisanal
                        quality.
                    </p>
                </div>
                <div>
                    <h4 className="font-label-caps text-label-caps mb-6 text-customer-primary uppercase">
                        Client Service
                    </h4>
                    <ul className="gap-4 flex flex-col">
                        <li>
                            <a
                                className="font-body-md text-body-md text-customer-secondary transition-colors hover:text-customer-primary"
                                href="#"
                            >
                                Contact
                            </a>
                        </li>
                        <li>
                            <a
                                className="font-body-md text-body-md text-customer-secondary transition-colors hover:text-customer-primary"
                                href="#"
                            >
                                Shipping & Returns
                            </a>
                        </li>
                        <li>
                            <a
                                className="font-body-md text-body-md text-customer-secondary transition-colors hover:text-customer-primary"
                                href="#"
                            >
                                Size Guide
                            </a>
                        </li>
                        <li>
                            <a
                                className="font-body-md text-body-md text-customer-secondary transition-colors hover:text-customer-primary"
                                href="#"
                            >
                                Store Locator
                            </a>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-label-caps text-label-caps mb-6 text-customer-primary uppercase">
                        Legal
                    </h4>
                    <ul className="gap-4 flex flex-col">
                        <li>
                            <a
                                className="font-body-md text-body-md text-customer-secondary transition-colors hover:text-customer-primary"
                                href="#"
                            >
                                Privacy Policy
                            </a>
                        </li>
                        <li>
                            <a
                                className="font-body-md text-body-md text-customer-secondary transition-colors hover:text-customer-primary"
                                href="#"
                            >
                                Terms of Service
                            </a>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-label-caps text-label-caps mb-6 text-customer-primary uppercase">
                        Newsletter
                    </h4>
                    <p className="font-body-md text-body-md mb-6 text-customer-secondary">
                        Join for exclusive early access and stories from the
                        journal.
                    </p>
                    <form className="border-outline py-2 flex items-center border-b">
                        <input
                            className="text-body-md font-body-md w-full border-none bg-transparent px-0 focus:ring-0"
                            placeholder="Email address"
                            type="email"
                        />
                        <button
                            className="font-label-caps text-label-caps tracking-widest text-customer-primary uppercase transition-opacity hover:opacity-70"
                            type="submit"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>
                <div className="mt-16 border-customer-outline-variant/20 pt-6 gap-6 flex flex-col items-center justify-between border-t md:col-span-4 md:flex-row">
                    <p className="font-body-md text-body-md text-customer-secondary">
                        © 2024 ESTHÉTIQUE. All rights reserved.
                    </p>
                    <div className="gap-6 flex">
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
