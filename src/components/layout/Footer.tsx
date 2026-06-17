import { Link } from 'react-router-dom';
import { Facebook, Instagram, MapPin, MessageCircle } from 'lucide-react';

const contactLinks = [
    {
        label: 'Ubicacion',
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
            <div className="mx-auto flex min-h-[72px] max-w-[1480px] flex-col items-center justify-between gap-5 px-5 py-4 sm:flex-row sm:px-10 lg:px-12">
                <div className="flex min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:gap-8 sm:text-left">
                    <span className="shrink-0 text-sm font-black sm:text-xl">Contactanos:</span>

                    <div className="flex items-center gap-3 sm:gap-5">
                        {contactLinks.map((link) => {
                            const Icon = link.icon;

                            return (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={link.label}
                                    className="briz-social-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/45 bg-brand-black/90 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-brand-black sm:h-13 sm:w-13"
                                >
                                    <Icon className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2.5} />
                                </a>
                            );
                        })}

                        <a
                            href="https://www.tiktok.com/@briz.bolivia"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="TikTok"
                            className="briz-social-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/45 bg-brand-black/90 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-brand-black sm:h-13 sm:w-13"
                        >
                            <TikTokIcon className="h-5 w-5 sm:h-7 sm:w-7" />
                        </a>
                    </div>
                </div>

                <Link to="/" className="flex shrink-0 items-center justify-center" aria-label="BRIZ inicio">
                    <img
                        src="/logo de briz.png"
                        alt="BRIZ"
                        className="h-14 w-auto max-w-[150px] object-contain brightness-0 invert sm:h-16 sm:max-w-[180px] lg:h-[72px] lg:max-w-[220px]"
                    />
                </Link>
            </div>
        </footer>
    );
}
