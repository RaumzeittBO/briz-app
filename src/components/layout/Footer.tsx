import { Link } from 'react-router-dom';
import { Facebook, Instagram, MapPin, MessageCircle } from 'lucide-react';

const contactLinks = [
    {
        label: 'Ubicación',
        href: 'https://maps.app.goo.gl/tgqw7ZK51Y68Q7L7A?g_st=iwb',
        icon: MapPin,
    },
    {
        label: 'WhatsApp',
        href: 'https://wa.me/59177860277',
        icon: MessageCircle,
    },
    {
        label: 'Facebook',
        href: 'https://www.facebook.com/Briz.Bolivia',
        icon: Facebook,
    },
    {
        label: 'Instagram',
        href: 'https://www.instagram.com/briz.bolivia',
        icon: Instagram,
    },
];

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.3z" />
        </svg>
    );
}

export default function Footer() {
    return (
        <footer className="relative mt-auto bg-brand-yellow text-brand-black font-cocon">
            <div className="pointer-events-none absolute -top-[18px] left-0 right-0 h-8 overflow-hidden" aria-hidden="true">
                <svg viewBox="0 0 1440 42" className="h-full w-full" preserveAspectRatio="none">
                    <path d="M0 17 C210 42 410 36 620 20 C810 5 960 4 1140 18 C1270 29 1372 27 1440 18" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
                </svg>
            </div>

            <div className="mx-auto flex min-h-[88px] max-w-[1480px] items-center justify-between gap-4 px-5 py-4 sm:min-h-[132px] sm:px-10 lg:px-12">
                <div className="flex min-w-0 items-center gap-3 sm:gap-8">
                    <span className="shrink-0 text-sm font-black sm:text-2xl">Contáctanos:</span>

                    <div className="flex items-center gap-2 sm:gap-9">
                        {contactLinks.map((link) => {
                            const Icon = link.icon;

                            return (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={link.label}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-yellow transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 sm:h-16 sm:w-16"
                                >
                                    <Icon className="h-6 w-6 sm:h-10 sm:w-10" strokeWidth={2.7} />
                                </a>
                            );
                        })}

                        <a
                            href="https://www.tiktok.com/@briz.bolivia"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="TikTok"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white text-white transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 sm:h-16 sm:w-16 sm:border-[3px]"
                        >
                            <TikTokIcon className="h-6 w-6 sm:h-10 sm:w-10" />
                        </a>
                    </div>
                </div>

                <Link to="/" className="flex shrink-0 flex-col items-center justify-center gap-0" aria-label="BRIZ inicio">
                    <img
                        src="/logo_bicicleta_principal.png"
                        alt="Bicicleta BRIZ"
                        className="h-10 w-16 object-contain brightness-0 invert sm:h-16 sm:w-24 lg:h-[82px] lg:w-[132px]"
                    />
                    <img
                        src="/logo_briz_principal.png"
                        alt="BRIZ"
                        className="-mt-1 h-5 w-auto max-w-[46px] object-contain brightness-0 invert sm:h-8 sm:max-w-[72px]"
                    />
                </Link>
            </div>
        </footer>
    );
}
