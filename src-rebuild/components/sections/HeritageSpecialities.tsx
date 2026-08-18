type HeritageCardProps = {
  className: string;
  image: string;
  eyebrow: string;
  title: string;
  description?: string;
  position?: string;
};

function HeritageCard({ className, image, eyebrow, title, description, position = 'center' }: HeritageCardProps) {
  return (
    <article className={`heritage-editorial__card ${className}`}>
      <img src={image} alt="" className="heritage-editorial__image" style={{ objectPosition: position }} loading="lazy" decoding="async" />
      <div className="heritage-editorial__shade" />
      <div className="heritage-editorial__card-copy">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
    </article>
  );
}

export default function HeritageSpecialities() {
  return (
    <section id="heritage" className="heritage-editorial" aria-label="Our Heritage">
      <style>{`
        .heritage-editorial {
          background: #F6EFE3;
          padding: clamp(68px, 9vw, 118px) clamp(20px, 4vw, 48px) clamp(76px, 9vw, 124px);
          overflow: hidden;
        }
        .heritage-editorial__wrap { width: min(100%, 1180px); margin: 0 auto; }
        .heritage-editorial__head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 32px;
          margin-bottom: clamp(32px, 4.5vw, 56px);
        }
        .heritage-editorial__eyebrow,
        .heritage-editorial__card-copy span {
          display: block;
          color: #C99A32;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          line-height: 1.2;
          text-transform: uppercase;
        }
        .heritage-editorial__eyebrow { margin-bottom: 14px; }
        .heritage-editorial__head h2 {
          max-width: 670px;
          margin: 0;
          color: #55000A;
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(40px, 5vw, 67px);
          font-weight: 600;
          letter-spacing: -0.03em;
          line-height: 0.98;
        }
        .heritage-editorial__head h2 em { color: #C99A32; font-style: italic; font-weight: 500; }
        .heritage-editorial__view-all {
          flex-shrink: 0;
          margin-bottom: 7px;
          border-bottom: 1px solid rgba(85, 0, 10, 0.45);
          color: #55000A;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          line-height: 1.65;
          text-decoration: none;
          text-transform: uppercase;
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .heritage-editorial__view-all:hover { color: #C99A32; border-color: #C99A32; }

        .heritage-editorial__grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          grid-template-rows: 218px 218px 238px;
          gap: 18px;
        }
        .heritage-editorial__card {
          position: relative;
          min-width: 0;
          overflow: hidden;
          border-radius: 18px;
          background: #55000A;
          isolation: isolate;
        }
        .heritage-editorial__feature { grid-column: span 8; grid-row: span 2; }
        .heritage-editorial__side-one,
        .heritage-editorial__side-two { grid-column: span 4; }
        .heritage-editorial__bottom { grid-column: span 4; }
        .heritage-editorial__image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .heritage-editorial__card:hover .heritage-editorial__image { transform: scale(1.045); }
        .heritage-editorial__shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(30, 10, 5, 0.02) 28%, rgba(31, 8, 8, 0.76) 100%);
          pointer-events: none;
        }
        .heritage-editorial__card-copy {
          position: absolute;
          right: clamp(18px, 2.5vw, 30px);
          bottom: clamp(18px, 2.5vw, 28px);
          left: clamp(18px, 2.5vw, 30px);
          z-index: 1;
        }
        .heritage-editorial__card-copy span { color: #E1B457; font-size: 9px; letter-spacing: 0.15em; }
        .heritage-editorial__card-copy h3 {
          margin: 7px 0 0;
          color: #FFF8EC;
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(25px, 2.6vw, 40px);
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 0.98;
        }
        .heritage-editorial__feature .heritage-editorial__card-copy h3 { font-size: clamp(36px, 4vw, 58px); }
        .heritage-editorial__card-copy p {
          max-width: 350px;
          margin: 10px 0 0;
          color: rgba(255, 248, 236, 0.82);
          font-family: Inter, sans-serif;
          font-size: 12px;
          line-height: 1.55;
        }

        @media (max-width: 820px) {
          .heritage-editorial__head { align-items: start; flex-direction: column; gap: 18px; }
          .heritage-editorial__view-all { margin-bottom: 0; }
          .heritage-editorial__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: 330px 218px 218px 230px 230px; gap: 14px; }
          .heritage-editorial__feature { grid-column: span 2; grid-row: span 1; }
          .heritage-editorial__side-one,
          .heritage-editorial__side-two,
          .heritage-editorial__bottom { grid-column: span 1; }
          .heritage-editorial__bottom:last-child { grid-column: 1 / -1; }
          .heritage-editorial__feature .heritage-editorial__card-copy h3 { font-size: clamp(36px, 7vw, 52px); }
        }

        @media (max-width: 520px) {
          .heritage-editorial { padding: 64px 16px 76px; }
          .heritage-editorial__head h2 { font-size: clamp(38px, 12vw, 52px); }
          .heritage-editorial__grid { display: flex; flex-direction: column; gap: 13px; }
          .heritage-editorial__card { height: 250px; flex: 0 0 250px; border-radius: 15px; }
          .heritage-editorial__feature { height: 360px; flex-basis: 360px; }
          .heritage-editorial__feature .heritage-editorial__card-copy h3 { font-size: 42px; }
          .heritage-editorial__card-copy h3 { font-size: 30px; }
          .heritage-editorial__card-copy p { font-size: 11px; }
        }

        @media (hover: none) {
          .heritage-editorial__card:hover .heritage-editorial__image { transform: none; }
        }
      `}</style>

      <div className="heritage-editorial__wrap">
        <header className="heritage-editorial__head">
          <div>
            <span className="heritage-editorial__eyebrow">Our Heritage</span>
            <h2>Flavours shaped by <em>tradition</em></h2>
          </div>
          <a className="heritage-editorial__view-all" href="#menu">View all flavours</a>
        </header>

        <div className="heritage-editorial__grid">
          <HeritageCard className="heritage-editorial__feature" image="/mishtichaat/chaat-plate.jpg" eyebrow="The Malwa table" title="Crafted for the shared table" description="Bold, bright and generously layered — every handful carries the warmth of a family recipe." />
          <HeritageCard className="heritage-editorial__side-one" image="/mishtichaat/dahi-puri.png" eyebrow="Handcrafted" title="Crisp by tradition" />
          <HeritageCard className="heritage-editorial__side-two" image="/mishtichaat/jalebi.jpg" eyebrow="Old city rituals" title="Made with patience" />
          <HeritageCard className="heritage-editorial__bottom" image="/mishtichaat/dahi-bhalla.jpg" eyebrow="Celebration" title="Generations of flavour" position="center 55%" />
          <HeritageCard className="heritage-editorial__bottom" image="/mishtichaat/kachori.jpg" eyebrow="The everyday feast" title="Malwa, in every bite" />
          <HeritageCard className="heritage-editorial__bottom" image="/mishtichaat/hero-food.jpg" eyebrow="From our kitchen" title="Time-honoured craft" position="center 70%" />
        </div>
      </div>
    </section>
  );
}
