import Navbar from '../components/layout/Navbar';
import Footer from '../components/sections/Footer';

export default function Contact() {
  return (
    <>
      <Navbar />
      <main className="contact-page" aria-label="Contact">
        <style>{`
          .contact-page {
            background: var(--bg-parchment);
            overflow: hidden;
          }
          .contact-hero {
            position: relative;
            min-height: clamp(420px, 60svh, 680px);
            display: flex;
            align-items: flex-start;
            isolation: isolate;
            background: #3D0007;
            overflow: hidden;
          }
          .contact-hero::before {
            content: '';
            position: absolute;
            inset: 0;
            z-index: -1;
            background:
              linear-gradient(90deg, rgba(42,0,5,0.72) 0%, rgba(42,0,5,0.34) 48%, rgba(42,0,5,0.12) 100%),
              url('/mishtichaat/chaat-plate.jpg') center / cover no-repeat;
          }
          .contact-hero__inner {
            width: min(100%, var(--container-max));
            margin: 0 auto;
            padding: clamp(34px, 5vw, 64px) clamp(20px, 4vw, 48px);
          }
          .contact-breadcrumb {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            color: rgba(255,248,236,0.78);
            font-family: Inter, sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }
          .contact-breadcrumb span { color: var(--gold-accent); }
          .contact-hero__title {
            max-width: 560px;
            margin: clamp(126px, 22vh, 210px) 0 0;
            color: var(--text-on-dark);
            font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
            font-size: clamp(60px, 8vw, 112px);
            font-weight: 600;
            letter-spacing: -0.045em;
            line-height: 0.82;
          }
          .contact-section {
            padding: clamp(64px, 9vw, 132px) clamp(16px, 3vw, 48px) clamp(70px, 10vw, 144px);
          }
          .contact-card {
            position: relative;
            width: min(100%, 1144px);
            min-height: 506px;
            margin: 0 auto;
            padding: clamp(36px, 6vw, 78px) clamp(32px, 7vw, 92px);
            display: flex;
            align-items: center;
            overflow: visible;
            border: 1px solid rgba(200,154,61,0.38);
            border-radius: 28px;
            background:
              radial-gradient(circle at 18% 12%, rgba(212,170,69,0.15), transparent 30%),
              linear-gradient(135deg, #5E000B 0%, #3D0007 100%);
            box-shadow: 0 26px 58px rgba(61,0,7,0.20);
          }
          .contact-card__copy {
            position: relative;
            z-index: 1;
            max-width: 505px;
          }
          .contact-card__eyebrow {
            display: block;
            margin-bottom: 16px;
            color: var(--gold-accent);
            font-family: Inter, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.19em;
          }
          .contact-card__title {
            margin: 0;
            color: var(--text-on-dark);
            font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
            font-size: clamp(43px, 5vw, 68px);
            font-weight: 600;
            letter-spacing: -0.04em;
            line-height: 0.9;
          }
          .contact-details {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 25px 34px;
            margin-top: 38px;
          }
          .contact-detail { min-width: 0; }
          .contact-detail__label {
            display: block;
            margin-bottom: 5px;
            color: var(--gold-pale);
            font-family: Inter, sans-serif;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }
          .contact-detail__value {
            margin: 0;
            color: rgba(255,248,236,0.82);
            font-family: Inter, sans-serif;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.65;
          }
          .contact-detail--wide { grid-column: 1 / -1; }
          .contact-card__visual {
            position: absolute;
            right: clamp(-56px, -2vw, -20px);
            bottom: clamp(-56px, -4vw, -28px);
            width: min(46%, 485px);
            aspect-ratio: 1 / 1;
            overflow: hidden;
            border: 8px solid var(--bg-parchment);
            border-radius: 50%;
            background: #191716;
            box-shadow: 0 24px 42px rgba(20,0,3,0.34);
          }
          .contact-card__visual img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          @media (max-width: 800px) {
            .contact-hero { min-height: 500px; }
            .contact-hero::before {
              background:
                linear-gradient(90deg, rgba(42,0,5,0.68), rgba(42,0,5,0.20)),
                url('/mishtichaat/chaat-plate.jpg') 58% center / cover no-repeat;
            }
            .contact-hero__title { margin-top: 175px; }
            .contact-card { min-height: auto; padding-bottom: 340px; }
            .contact-card__visual {
              right: 50%;
              bottom: -48px;
              width: min(78vw, 360px);
              transform: translateX(50%);
            }
          }
          @media (max-width: 520px) {
            .contact-hero { min-height: 454px; }
            .contact-hero__inner { padding-top: 28px; }
            .contact-hero__title { margin-top: 162px; font-size: clamp(56px, 17vw, 76px); }
            .contact-section { padding: 50px 16px 92px; }
            .contact-card { border-radius: 20px; padding: 34px 28px 290px; }
            .contact-card__title { font-size: 47px; }
            .contact-details { grid-template-columns: 1fr; gap: 20px; margin-top: 30px; }
            .contact-detail--wide { grid-column: auto; }
            .contact-card__visual { bottom: -42px; width: min(75vw, 300px); border-width: 6px; }
          }
        `}</style>

        <section className="contact-hero" aria-labelledby="contact-title">
          <div className="contact-hero__inner">
            <p className="contact-breadcrumb">Home <span>/</span> Contact</p>
            <h1 id="contact-title" className="contact-hero__title">Let&apos;s talk<br />flavour.</h1>
          </div>
        </section>

        <section className="contact-section" aria-label="Contact information">
          <div className="contact-card">
            <div className="contact-card__copy">
              <span className="contact-card__eyebrow">MishtiChaat · Bengaluru</span>
              <h2 className="contact-card__title">We&apos;d love to hear from you.</h2>
              <div className="contact-details">
                <div className="contact-detail">
                  <span className="contact-detail__label">Visit Us</span>
                  <p className="contact-detail__value">Our Namkeen Store<br />Your address here</p>
                </div>
                <div className="contact-detail">
                  <span className="contact-detail__label">Call Us</span>
                  <p className="contact-detail__value">+91 XXXXX XXXXX</p>
                </div>
                <div className="contact-detail">
                  <span className="contact-detail__label">Email Us</span>
                  <p className="contact-detail__value">hello@yourbrand.com</p>
                </div>
                <div className="contact-detail contact-detail--wide">
                  <span className="contact-detail__label">Business Enquiries</span>
                  <p className="contact-detail__value">We&apos;re happy to help with orders and enquiries.</p>
                </div>
              </div>
            </div>
            <div className="contact-card__visual" aria-hidden="true">
              <img src="/mishtichaat/dahi-puri.png" alt="" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
