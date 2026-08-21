import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, CheckCircle2, LockKeyhole, Mail, UserRound, Phone, Chrome } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import SEOHead from '../components/seo/SEOHead';
import { useCustomerSession } from '../components/layout/CustomerSessionContext';

type Mode = 'signin' | 'signup';

export default function Account() {
  const [mode, setMode] = useState<Mode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useCustomerSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const destination = (location.state as any)?.from || '/dashboard';
  const switchMode = (next: Mode) => { setMode(next); setMessage(null); setShowPassword(false); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    if (mode === 'signup') {
      const name = String(data.get('name') ?? '').trim();
      const phone = String(data.get('phone') ?? '').trim();
      const confirmPassword = String(data.get('confirmPassword') ?? '');
      const terms = data.get('terms');

      if (!name || !phone || !terms) {
        setMessage({ type: 'error', text: 'Please complete all details and accept the terms to continue.' });
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setMessage({ type: 'error', text: 'Please enter a valid email address.' });
        return;
      }
      if (password.length < 6) {
        setMessage({ type: 'error', text: 'Please use a password of at least 6 characters.' });
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'Your passwords do not match. Please try again.' });
        return;
      }

      setIsSubmitting(true);
      setMessage(null);

      const result = await register({ name, email, phone, password });
      setIsSubmitting(false);

      if (!result.success) {
        setMessage({ type: 'error', text: result.message || 'Failed to create account.' });
        return;
      }

      setMessage({ type: 'success', text: 'Account created! Redirecting…' });
      window.setTimeout(() => navigate(destination), 650);
      return;
    }

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please enter your email address and password.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setMessage({ type: 'error', text: result.message || 'Invalid email address or password.' });
      return;
    }

    setMessage({ type: 'success', text: 'Welcome back. Redirecting…' });
    window.setTimeout(() => navigate(destination), 650);
  };
  return <><SEOHead title="Customer Account" noIndex={true} /><Navbar /><main className="account-page"><style>{`
    .account-page{min-height:calc(100dvh - 68px);display:grid;grid-template-columns:minmax(0,1.06fr) minmax(460px,.94fr);background:var(--bg-parchment)}.account-visual{position:relative;display:flex;flex-direction:column;justify-content:space-between;min-height:calc(100dvh - 68px);padding:clamp(34px,5vw,74px);overflow:hidden;color:var(--text-on-dark);background:linear-gradient(135deg,rgba(61,0,7,.78),rgba(42,0,5,.56)),url('/mishtichaat/hero-sweets.jpg') center/cover}.account-visual:before{content:'';position:absolute;inset:16px;border:1px solid rgba(240,223,160,.42);pointer-events:none}.account-visual:after{content:'';position:absolute;width:430px;height:430px;right:-215px;bottom:-190px;border:1px solid rgba(212,170,69,.54);border-radius:50%;box-shadow:0 0 0 34px rgba(212,170,69,.08),0 0 0 68px rgba(212,170,69,.05)}.account-back,.account-visual__copy{position:relative;z-index:1}.account-back{display:inline-flex;align-items:center;gap:8px;width:max-content;color:rgba(255,248,236,.84);font:700 11px Inter,sans-serif;letter-spacing:.13em;text-decoration:none;text-transform:uppercase;transition:color .18s}.account-back:hover{color:var(--gold-pale)}.account-visual__eyebrow{margin-bottom:18px;color:var(--gold-pale);font:800 11px Inter,sans-serif;letter-spacing:.21em;text-transform:uppercase}.account-visual__title{max-width:530px;font-family:'Cormorant Garamond','Playfair Display',Georgia,serif;font-size:clamp(56px,6.8vw,94px);font-weight:600;line-height:.86;letter-spacing:-.05em}.account-visual__copy p:last-child{max-width:380px;margin-top:24px;color:rgba(255,248,236,.76);font-size:15px;line-height:1.7}.account-form-area{display:flex;align-items:center;justify-content:center;padding:clamp(42px,7vw,104px) clamp(24px,6vw,90px);background:var(--bg-ivory)}.account-form{width:min(100%,420px)}.account-brand{margin-bottom:clamp(36px,5vw,60px);color:var(--brand-maroon);font-family:'Cormorant Garamond','Playfair Display',Georgia,serif;font-size:24px;font-weight:700;letter-spacing:.035em}.account-kicker{margin-bottom:10px;color:var(--gold);font:800 10px Inter,sans-serif;letter-spacing:.18em;text-transform:uppercase}.account-heading{color:var(--brand-maroon);font-family:'Cormorant Garamond','Playfair Display',Georgia,serif;font-size:clamp(44px,4.2vw,58px);font-weight:600;line-height:.92;letter-spacing:-.045em}.account-subtitle{margin:15px 0 30px;color:var(--text-muted);font-size:14px;line-height:1.65}.account-fields{display:grid;gap:16px}.account-field label{display:block;margin:0 0 7px;color:var(--text-dark);font:700 11px Inter,sans-serif;letter-spacing:.09em;text-transform:uppercase}.account-input{display:flex;align-items:center;gap:10px;border:1px solid var(--border-soft);background:var(--bg-card);transition:border-color .18s,box-shadow .18s}.account-input:focus-within{border-color:var(--gold);box-shadow:0 0 0 3px rgba(212,170,69,.13)}.account-input svg{margin-left:14px;color:var(--gold);flex:none}.account-input input{width:100%;height:49px;border:0;outline:0;background:transparent;color:var(--text-dark);font:500 14px Inter,sans-serif}.password-toggle{width:42px;height:42px;display:grid;place-items:center;border:0;background:transparent;color:var(--text-muted);cursor:pointer;transition:color .18s}.password-toggle:hover{color:var(--brand-maroon)}.account-options{display:flex;justify-content:flex-end;margin-top:-4px}.account-options button{border:0;background:transparent;color:var(--brand-maroon);font:600 12px Inter,sans-serif;text-decoration:underline;text-underline-offset:3px;cursor:pointer}.account-message{display:flex;align-items:flex-start;gap:9px;margin-top:18px;padding:11px 13px;border:1px solid var(--border-soft);color:var(--text-muted);font-size:12px;line-height:1.55}.account-message--error{border-color:#C97A65;background:#FFF6F1;color:#803520}.account-message--success{border-color:rgba(100,130,79,.36);background:#F7FBF1;color:#466536}.account-message svg{flex:none;margin-top:1px}.account-submit{width:100%;height:51px;margin-top:23px;border:0;border-radius:999px;background:var(--brand-maroon);color:var(--text-on-dark);font:800 11px Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:background .18s,transform .18s,box-shadow .18s}.account-submit:hover{background:var(--maroon-hover);transform:translateY(-1px);box-shadow:0 8px 18px rgba(85,0,10,.2)}.account-divider{display:flex;align-items:center;gap:12px;margin:24px 0;color:var(--text-light);font:700 10px Inter,sans-serif;letter-spacing:.14em}.account-divider:before,.account-divider:after{content:'';height:1px;flex:1;background:var(--border-soft)}.social-button{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;height:48px;border:1px solid var(--border-soft);background:transparent;color:var(--text-dark);font:700 12px Inter,sans-serif;cursor:pointer;transition:border-color .18s,background .18s}.social-button:hover{border-color:var(--gold);background:var(--bg-card-alt)}.social-button svg{color:var(--gold);width:18px}.account-switch{margin-top:26px;color:var(--text-muted);font-size:13px;text-align:center}.account-switch button{border:0;background:transparent;color:var(--brand-maroon);font:700 13px Inter,sans-serif;text-decoration:underline;text-underline-offset:3px;cursor:pointer}.terms{display:flex;gap:10px;align-items:flex-start;margin-top:1px;color:var(--text-muted);font-size:12px;line-height:1.5}.terms input{width:16px;height:16px;accent-color:var(--brand-maroon);margin-top:1px;flex:none}.terms a{color:var(--brand-maroon)}@media(max-width:900px){.account-page{grid-template-columns:1fr}.account-visual{min-height:315px;padding:32px;justify-content:flex-end}.account-visual:before{inset:12px}.account-visual__title{font-size:54px}.account-visual__copy p:last-child{margin-top:12px;font-size:13px}.account-back{position:absolute;top:29px;left:32px}.account-form-area{padding:55px 28px 72px}.account-brand{margin-bottom:38px}}@media(max-width:480px){.account-visual{min-height:280px;padding:27px 24px}.account-back{top:26px;left:24px}.account-visual__title{font-size:48px}.account-visual__eyebrow{margin-bottom:13px;font-size:9px}.account-visual__copy p:last-child{display:none}.account-form-area{padding:45px 20px 58px}.account-heading{font-size:45px}.account-subtitle{margin-bottom:26px}.account-brand{margin-bottom:33px}}
  `}</style><section className="account-visual" aria-label="Malwa Namkeen House heritage"><Link className="account-back" to="/"><ArrowLeft size={15}/> Back to the house</Link><div className="account-visual__copy"><p className="account-visual__eyebrow">Malwa Namkeen House</p><h1 className="account-visual__title">Made for<br/>the moments<br/>you savour.</h1><p>Rooted in Malwa, prepared with care, and shared with warmth — a little closer to home with every order.</p></div></section><section className="account-form-area"><div className="account-form"><div className="account-brand">MALWA NAMKEEN HOUSE</div><p className="account-kicker">{mode==='signin'?'Your account':'Join the house'}</p><h2 className="account-heading">{mode==='signin'?'Welcome Back':'Create an account'}</h2><p className="account-subtitle">{mode==='signin'?'Sign in to continue your journey with authentic flavours of Malwa.':'Create your account for a more considered Malwa Namkeen House experience.'}</p><form onSubmit={submit} noValidate><div className="account-fields">{mode==='signup'&&<><div className="account-field"><label htmlFor="account-name">Full name</label><div className="account-input"><UserRound size={17}/><input id="account-name" name="name" autoComplete="name" placeholder="Your full name"/></div></div><div className="account-field"><label htmlFor="account-phone">Phone number</label><div className="account-input"><Phone size={17}/><input id="account-phone" name="phone" type="tel" autoComplete="tel" placeholder="+91 00000 00000"/></div></div></>}<div className="account-field"><label htmlFor="account-email">Email address</label><div className="account-input"><Mail size={17}/><input id="account-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required/></div></div><div className="account-field"><label htmlFor="account-password">Password</label><div className="account-input"><LockKeyhole size={17}/><input id="account-password" name="password" type={showPassword?'text':'password'} autoComplete={mode==='signin'?'current-password':'new-password'} placeholder="Enter your password" required/><button type="button" className="password-toggle" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(value=>!value)}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>{mode==='signup'&&<div className="account-field"><label htmlFor="account-confirm">Confirm password</label><div className="account-input"><LockKeyhole size={17}/><input id="account-confirm" name="confirmPassword" type={showPassword?'text':'password'} autoComplete="new-password" placeholder="Re-enter your password" required/></div></div>}{mode==='signup'&&<label className="terms"><input name="terms" type="checkbox"/><span>I agree to the <a href="/terms-and-conditions">Terms &amp; Conditions</a> and Privacy Policy.</span></label>}</div>{mode==='signin'&&<div className="account-options"><button type="button" onClick={()=>setMessage({type:'success',text:'For password recovery assistance, please reach out to customer support or message us on WhatsApp.'})}>Forgot Password?</button></div>}{message&&<div className={`account-message account-message--${message.type}`} role="status"><CheckCircle2 size={16}/><span>{message.text}</span></div>}<button className="account-submit" type="submit">{mode==='signin'?'Sign in':'Create account'}</button></form><div className="account-divider">OR</div><button className="social-button" type="button" onClick={()=>setMessage({type:'success',text:'Social sign-in is currently in setup. Please sign in using your email and password.'})}><Chrome/> Continue with Google</button><p className="account-switch">{mode==='signin'?'New to Malwa Namkeen House?':'Already have an account?'} <button type="button" onClick={()=>switchMode(mode==='signin'?'signup':'signin')}>{mode==='signin'?'Create an account':'Sign In'}</button></p></div></section></main></>;
}
