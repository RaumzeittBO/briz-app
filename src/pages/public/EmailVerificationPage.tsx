import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { CheckCircle2, MailCheck, ShieldAlert } from 'lucide-react';
import { auth } from '@/lib/firebase';
import ArtworkPicture from '@/components/ArtworkPicture';

export default function EmailVerificationPage() {
  const [params] = useSearchParams();
  const mode = params.get('mode') || '';
  const code = params.get('oobCode') || '';
  const language = (params.get('lang') || navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  const [status, setStatus] = useState<'working' | 'success' | 'error' | 'reset'>('working');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    if (!code) {
      setStatus('error'); setMessage(language === 'es' ? 'El enlace está incompleto o ya fue utilizado.' : 'This link is incomplete or has already been used.');
      return;
    }
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('oobCode'); cleanUrl.searchParams.delete('apiKey'); cleanUrl.searchParams.delete('continueUrl');
    window.history.replaceState({}, document.title, `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    if (mode === 'resetPassword') {
      verifyPasswordResetCode(auth, code).then(email => { setResetEmail(email); setStatus('reset'); })
        .catch(() => { setStatus('error'); setMessage(language === 'es' ? 'El enlace venció o ya no es válido. Solicita uno nuevo desde BRIZ.' : 'This link has expired or is invalid. Request a new one from BRIZ.'); });
      return;
    }
    if (!['verifyEmail', 'verifyAndChangeEmail', 'recoverEmail'].includes(mode)) {
      setStatus('error'); setMessage(language === 'es' ? 'Este enlace no corresponde a una acción de cuenta compatible.' : 'This link is not a supported account action.');
      return;
    }
    applyActionCode(auth, code).then(() => {
      setStatus('success');
      setMessage(mode === 'recoverEmail'
        ? (language === 'es' ? 'La dirección de correo anterior fue restaurada.' : 'Your previous email address has been restored.')
        : (language === 'es' ? 'Tu correo fue confirmado correctamente. Ya puedes volver a BRIZ e iniciar sesión.' : 'Your email has been verified. Return to BRIZ and sign in.'));
    }).catch(() => {
      setStatus('error'); setMessage(language === 'es' ? 'El enlace venció o ya fue utilizado. Solicita un nuevo enlace desde BRIZ.' : 'This link has expired or was already used. Request a new link from BRIZ.');
    });
  }, [code, language, mode]);

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      await confirmPasswordReset(auth, code, password);
      setStatus('success'); setMessage(language === 'es' ? 'Contraseña actualizada. Ya puedes iniciar sesión en BRIZ.' : 'Password updated. You can now sign in to BRIZ.');
    } catch {
      setStatus('error'); setMessage(language === 'es' ? 'No se pudo actualizar la contraseña. Solicita un nuevo enlace de recuperación.' : 'Could not update your password. Request a new reset link.');
    } finally { setSaving(false); }
  };

  return <main className="grid min-h-screen place-items-center bg-[#FFF9E8] p-5 text-brand-charcoal">
    <section className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-7 text-center shadow-xl sm:p-10">
      <ArtworkPicture slotId="customer_auth_logo" language={language} alt="BRIZ" className="mb-7 flex justify-center" imageClassName="h-20 w-auto object-contain" />
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-brand-yellow/20">
        {status === 'error' ? <ShieldAlert className="h-8 w-8 text-amber-800" /> : status === 'success' ? <CheckCircle2 className="h-8 w-8 text-emerald-700" /> : <MailCheck className="h-8 w-8" />}
      </div>
      <h1 className="text-xl font-black tracking-wide sm:text-2xl">{status === 'reset' ? (language === 'es' ? 'RESTABLECER CONTRASEÑA' : 'RESET PASSWORD') : status === 'success' ? (language === 'es' ? 'CUENTA BRIZ ACTUALIZADA' : 'BRIZ ACCOUNT UPDATED') : status === 'error' ? (language === 'es' ? 'NO SE PUDO COMPLETAR' : 'ACTION COULD NOT BE COMPLETED') : (language === 'es' ? 'PROCESANDO ENLACE' : 'PROCESSING LINK')}</h1>
      {status === 'reset' ? <form onSubmit={savePassword} className="mt-5 space-y-4 text-left">
        <p className="text-center text-sm text-stone-600">{language === 'es' ? `Nueva contraseña para ${resetEmail}` : `New password for ${resetEmail}`}</p>
        <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-stone-300 px-4" placeholder={language === 'es' ? 'Nueva contraseña' : 'New password'} />
        <button disabled={saving} className="h-12 w-full rounded-xl bg-brand-yellow font-black disabled:opacity-60">{saving ? (language === 'es' ? 'Guardando…' : 'Saving…') : (language === 'es' ? 'Guardar contraseña' : 'Save password')}</button>
      </form> : <p role="status" className="mt-4 text-sm leading-relaxed text-stone-600">{message || (language === 'es' ? 'Estamos validando tu enlace seguro.' : 'We are validating your secure link.')}</p>}
      {status !== 'reset' && <Link to="/" className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-brand-yellow px-7 font-black hover:bg-yellow-300">{language === 'es' ? 'Volver a BRIZ' : 'Return to BRIZ'}</Link>}
      {status === 'success' && <p className="mt-4 text-xs text-stone-500">{language === 'es' ? 'El enlace solo puede utilizarse una vez.' : 'This link can only be used once.'}</p>}
    </section>
  </main>;
}
