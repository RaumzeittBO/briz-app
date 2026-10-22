import { Link } from 'react-router-dom';
import { Facebook, Instagram, MapPin, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ArtworkPicture from '@/components/ArtworkPicture';

const contactLinks = [
    {
        labelEs: 'Ubicación',
        labelEn: 'Location',
        href: 'https://maps.app.goo.gl/tgqw7ZK51Y68Q7L7A?g_st=iwb',
        icon: MapPin,
    },
    {
        labelEs: 'WhatsApp',
        labelEn: 'WhatsApp',
        href: 'https://wa.me/59177860277',
        icon: MessageCircle,
    },
    {
        labelEs: 'Facebook',
        labelEn: 'Facebook',
        href: 'https://www.facebook.com/Briz.Bolivia',
        icon: Facebook,
    },
    {
        labelEs: 'Instagram',
        labelEn: 'Instagram',
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
    const { language } = useLanguage();
    return (
        <footer className="relative mt-auto bg-brand-yellow text-white font-cocon">
            <div className="mx-auto flex min-h-[72px] max-w-[1480px] flex-col items-center justify-between gap-5 px-5 py-4 sm:flex-row sm:px-10 lg:px-12">
                <div className="flex min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:gap-8 sm:text-left">
                    <span className="shrink-0 text-sm font-black text-white sm:text-xl">
                        {language === 'es' ? 'Contáctanos:' : 'Contact us:'}
                    </span>

                    <div className="flex items-center gap-3 sm:gap-5">
                        {contactLinks.map((link) => {
                            const Icon = link.icon;
                            const label = language === 'es' ? link.labelEs : link.labelEn;

                            return (
                                <a
                                    key={link.labelEs}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="briz-social-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white text-brand-black shadow-[0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-white hover:text-brand-yellow sm:h-13 sm:w-13"
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
                            className="briz-social-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white text-brand-black shadow-[0_8px_18px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-white hover:text-brand-yellow sm:h-13 sm:w-13"
                        >
                            <TikTokIcon className="h-5 w-5 sm:h-7 sm:w-7" />
                        </a>
                    </div>
                </div>

                <Link to="/" className="flex shrink-0 items-center justify-center" aria-label={language === 'es' ? 'BRIZ inicio' : 'BRIZ home'}>
                    <ArtworkPicture slotId="home_brand_logo" language={language} alt="BRIZ" imageClassName="h-[72px] w-auto max-w-[195px] object-contain brightness-0 invert sm:h-[84px] sm:max-w-[235px] lg:h-[94px] lg:max-w-[286px]" />
                </Link>
            </div>
        </footer>
    );
}
