"use client";

import { useEffect, useRef, useState } from "react";

const MARQUEE_ITEMS = [
  "3-minute avg. pickup time",
  "15% driver commission — lowest in the market",
  "Instant payouts, daily",
  "In-app SOS safety button",
  "Pay with card, mobile money, or wallet",
  "Scheduled rides up to 7 days in advance",
];

export function JalaRideLanding() {
  const curRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const mx = useRef(0);
  const my = useRef(0);
  const rx = useRef(0);
  const ry = useRef(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const prefersFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!prefersFinePointer) return;

    const onMove = (e: MouseEvent) => {
      mx.current = e.clientX;
      my.current = e.clientY;
      const cur = curRef.current;
      if (cur) {
        cur.style.left = `${e.clientX}px`;
        cur.style.top = `${e.clientY}px`;
      }
    };

    let rafId = 0;
    const animRing = () => {
      rx.current += (mx.current - rx.current) * 0.12;
      ry.current += (my.current - ry.current) * 0.12;
      const ring = ringRef.current;
      if (ring) {
        ring.style.left = `${rx.current}px`;
        ring.style.top = `${ry.current}px`;
      }
      rafId = requestAnimationFrame(animRing);
    };
    rafId = requestAnimationFrame(animRing);

    const hoverables = "a, button, .city-card, .testi-card, .price-card, .feature-item, .how-step";
    const onEnter = () => {
      curRef.current?.classList.add("hovered");
      ringRef.current?.classList.add("hovered");
    };
    const onLeave = () => {
      curRef.current?.classList.remove("hovered");
      ringRef.current?.classList.remove("hovered");
    };

    document.addEventListener("mousemove", onMove);
    const nodes = document.querySelectorAll(hoverables);
    nodes.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMove);
      nodes.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    const id = requestAnimationFrame(() => {
      document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    });
    return () => {
      cancelAnimationFrame(id);
      obs.disconnect();
    };
  }, []);

  const marqueeTrack = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="landing-page">
      <div ref={curRef} className="cursor" aria-hidden />
      <div ref={ringRef} className="cursor-ring" aria-hidden />

      <nav ref={navRef} id="navbar">
        <a href="#home" className="nav-logo">
          TRIVE<span>X</span>A
        </a>
        <ul className="nav-links">
          <li>
            <a href="#how">How it works</a>
          </li>
          <li>
            <a href="#rides">Ride types</a>
          </li>
          <li>
            <a href="#drivers">Drive with us</a>
          </li>
          <li>
            <a href="#safety">Safety</a>
          </li>
          <li>
            <a href="#cities">Cities</a>
          </li>
        </ul>
        <a href="#download" className="nav-cta nav-cta-desktop">
          Download App
        </a>
        <button
          type="button"
          className="nav-hamburger"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div className={`mobile-nav ${mobileOpen ? "open" : ""}`}>
        <a href="#how" onClick={() => setMobileOpen(false)}>
          How it works
        </a>
        <a href="#rides" onClick={() => setMobileOpen(false)}>
          Ride types
        </a>
        <a href="#drivers" onClick={() => setMobileOpen(false)}>
          Drive with us
        </a>
        <a href="#safety" onClick={() => setMobileOpen(false)}>
          Safety
        </a>
        <a href="#cities" onClick={() => setMobileOpen(false)}>
          Cities
        </a>
        <a href="#download" className="nav-cta" onClick={() => setMobileOpen(false)}>
          Download App
        </a>
      </div>

      <section className="hero" id="home">
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1800&q=80&auto=format"
            alt="City night driving"
            loading="eager"
          />
        </div>
        <div className="hero-glow" />
        <div className="hero-glow2" />

        <div className="hero-content">
          <div className="hero-eyebrow">
            <span />
            Now available in 12 cities
          </div>
          <h1>
            Move <em>Smarter</em>.<br />
            Earn <em>Better</em>.
          </h1>
          <p className="hero-sub">
            The ride-hailing platform built for the next generation. Faster pickups, fairer prices, and
            drivers who actually earn what they deserve.
          </p>
          <div className="hero-actions">
            <a href="#download" className="btn-primary">
              Get the app
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a href="#drivers" className="btn-outline">
              Drive with Jala Ride
            </a>
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="num">
              2M<span>+</span>
            </div>
            <div className="label">Rides completed</div>
          </div>
          <div className="hero-stat">
            <div className="num">
              85k<span>+</span>
            </div>
            <div className="label">Active drivers</div>
          </div>
          <div className="hero-stat">
            <div className="num">
              4.9<span>★</span>
            </div>
            <div className="label">Avg. rider rating</div>
          </div>
        </div>
      </section>

      <div className="marquee-section">
        <div className="marquee-track">
          {marqueeTrack.map((text, i) => (
            <div key={`${text}-${i}`} className="marquee-item">
              <div className="marquee-dot" />
              {text}
            </div>
          ))}
        </div>
      </div>

      <section id="how">
        <div className="reveal">
          <span className="section-label">Simple by design</span>
          <h2 className="section-title">
            A ride in <em>four steps</em>
          </h2>
          <p className="section-sub">
            From app open to your destination — Jala Ride keeps the experience seamless, every time.
          </p>
        </div>

        <div className="how-grid reveal" style={{ transitionDelay: "0.15s" }}>
          {[
            {
              n: "01",
              icon: "📍",
              title: "Set your destination",
              desc: "Type where you're going or drop a pin on the live map. Jala Ride calculates the best route and shows you the fare upfront.",
            },
            {
              n: "02",
              icon: "🚗",
              title: "Choose your ride",
              desc: "Economy, Comfort, XL or Moto — pick the right vehicle for your journey. All prices shown before you confirm.",
            },
            {
              n: "03",
              icon: "📡",
              title: "Track in real-time",
              desc: "Watch your driver approach on a live map. Chat or call them (number masked) right from the app.",
            },
            {
              n: "04",
              icon: "💳",
              title: "Pay & rate",
              desc: "Payment is automatic via your saved method. Rate your driver and earn loyalty points on every completed trip.",
            },
          ].map((step) => (
            <div key={step.n} className="how-step">
              <div className="step-num">{step.n}</div>
              <div className="step-icon">{step.icon}</div>
              <div className="step-title">{step.title}</div>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="features-inner">
          <div className="reveal">
            <div className="features-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&auto=format"
                alt="Rider using Jala Ride app"
              />
              <div className="features-badge">
                <div className="badge-num">4.9★</div>
                <div className="badge-text">App Store rating</div>
              </div>
            </div>
          </div>

          <div className="reveal" style={{ transitionDelay: "0.15s" }}>
            <span className="section-label">Rider app</span>
            <h2 className="section-title">
              Everything you need, <em>nothing you don&apos;t</em>
            </h2>
            <p className="section-sub">
              Designed to get you moving in under 10 seconds — powerful features hidden behind a beautifully
              simple interface.
            </p>

            <div className="feature-list">
              {[
                {
                  icon: "🗺️",
                  title: "Live GPS tracking",
                  text: "See exactly where your driver is, their ETA, and the fastest route to you — all updating every 2 seconds.",
                },
                {
                  icon: "💰",
                  title: "Upfront pricing, always",
                  text: "You see the exact fare before you book. No surge surprises, no hidden fees — what you see is what you pay.",
                },
                {
                  icon: "📅",
                  title: "Schedule rides in advance",
                  text: "Book a ride up to 7 days ahead for airports, early mornings, or any planned journey.",
                },
                {
                  icon: "🎁",
                  title: "Loyalty rewards",
                  text: "Earn Jala Ride points on every ride. Redeem for free trips, upgrades, and exclusive partner offers.",
                },
              ].map((f) => (
                <div key={f.title} className="feature-item">
                  <div className="feature-icon">{f.icon}</div>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="rides">
        <div className="reveal">
          <span className="section-label">Ride categories</span>
          <h2 className="section-title">
            A ride for every <em>occasion</em>
          </h2>
          <p className="section-sub">From daily commutes to airport pickups — choose the right vehicle for the moment.</p>
        </div>

        <div className="pricing-grid reveal" style={{ transitionDelay: "0.15s" }}>
          <div className="price-card">
            <span className="ride-icon">🚗</span>
            <div className="price-name">Economy</div>
            <p className="price-desc">
              Affordable everyday rides. Efficient, clean, and always on time for your daily commute.
            </p>
            <div className="price-from">Starting from</div>
            <div className="price-amount">₦800</div>
            <ul className="price-features">
              <li>Up to 4 passengers</li>
              <li>AC standard</li>
              <li>3-min avg. wait time</li>
              <li>Cash or cashless</li>
            </ul>
          </div>

          <div className="price-card featured">
            <div className="price-badge">Popular</div>
            <span className="ride-icon">🚙</span>
            <div className="price-name">Comfort</div>
            <p className="price-desc">
              Premium sedans and SUVs for when you want a little more. Top-rated drivers, quieter rides.
            </p>
            <div className="price-from">Starting from</div>
            <div className="price-amount">₦1,500</div>
            <ul className="price-features">
              <li>Up to 4 passengers</li>
              <li>Premium vehicles only</li>
              <li>Priority matching</li>
              <li>In-app driver rating 4.8+</li>
            </ul>
          </div>

          <div className="price-card">
            <span className="ride-icon">🚐</span>
            <div className="price-name">XL / Group</div>
            <p className="price-desc">
              Spacious SUVs and minivans for groups, families, or when you have extra luggage.
            </p>
            <div className="price-from">Starting from</div>
            <div className="price-amount">₦2,200</div>
            <ul className="price-features">
              <li>Up to 6 passengers</li>
              <li>Extra luggage space</li>
              <li>Perfect for airports</li>
              <li>Child seat available</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="driver-section" id="drivers">
        <div className="driver-bg">
          <img
            src="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1600&q=80&auto=format"
            alt="Driver on road"
          />
        </div>

        <div className="driver-inner">
          <div className="reveal">
            <span className="section-label">For drivers</span>
            <h2 className="section-title">
              Drive on <em>your terms</em>.<br />
              Keep <em>more</em> of what you earn.
            </h2>
            <p className="section-sub">
              Jala Ride charges just 15% commission — the lowest of any major platform. Join 85,000+ drivers
              already earning more every week.
            </p>

            <div className="driver-perks">
              <div className="perk">
                <div className="perk-num">15%</div>
                <div className="perk-label">Commission rate — half of what Uber charges</div>
              </div>
              <div className="perk">
                <div className="perk-num">₦0</div>
                <div className="perk-label">Sign-up fee. Free vehicle inspection. Free onboarding.</div>
              </div>
              <div className="perk">
                <div className="perk-num">24h</div>
                <div className="perk-label">Payout cycle. Get your earnings every single day.</div>
              </div>
              <div className="perk">
                <div className="perk-num">85k</div>
                <div className="perk-label">Active drivers already on the platform and growing</div>
              </div>
            </div>

            <div style={{ marginTop: "2.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <a href="#download" className="btn-primary">
                Start driving today
              </a>
              <a href="#how" className="btn-outline">
                Learn more
              </a>
            </div>
          </div>

          <div className="driver-image-col reveal" style={{ transitionDelay: "0.2s" }}>
            <div className="driver-card">
              <div className="card-label">THIS WEEK&apos;S EARNINGS</div>
              <div className="card-val">₦78,400</div>
              <div className="card-sub">↑ 12% above average</div>
            </div>
            <div className="driver-img-frame">
              <img
                src="https://images.unsplash.com/photo-1535496695891-445be3941def?w=700&q=80&auto=format"
                alt="Jala Ride driver smiling"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="safety-section" id="safety">
        <div className="safety-grid">
          <div className="reveal">
            <div className="safety-img">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=80&auto=format"
                alt="Safe ride at night"
              />
              <div className="safety-sos">SOS</div>
            </div>
          </div>

          <div className="reveal" style={{ transitionDelay: "0.15s" }}>
            <span className="section-label">Safety first</span>
            <h2 className="section-title">
              Every ride is a <em>protected</em> ride
            </h2>
            <p className="section-sub">
              Safety isn&apos;t an add-on at Jala Ride — it&apos;s baked into every trip. From background-checked
              drivers to real-time monitoring.
            </p>

            <div className="safety-features">
              {[
                {
                  icon: "🆘",
                  title: "In-app SOS button",
                  text: "One tap connects you to emergency services and sends your live location to trusted contacts.",
                },
                {
                  icon: "🔒",
                  title: "Number masking",
                  text: "Your real phone number is never shared with drivers. All calls go through an encrypted proxy.",
                },
                {
                  icon: "👁️",
                  title: "Live trip monitoring",
                  text: "Our 24/7 safety team monitors for unexpected stops or route deviations in real time.",
                },
                {
                  icon: "✅",
                  title: "Verified drivers only",
                  text: "Every driver passes a criminal background check, vehicle inspection, and ID verification before their first trip.",
                },
              ].map((s) => (
                <div key={s.title} className="safety-item">
                  <div className="icon">{s.icon}</div>
                  <div>
                    <h5>{s.title}</h5>
                    <p>{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cities-section" id="cities">
        <div className="reveal" style={{ textAlign: "center" }}>
          <span className="section-label">Where we operate</span>
          <h2 className="section-title">
            Available across <em>12 cities</em>
          </h2>
          <p className="section-sub" style={{ margin: "1rem auto 0" }}>
            Launching in more cities every quarter. If we&apos;re not in yours yet, we&apos;re coming soon.
          </p>
        </div>

        <div className="cities-grid reveal" style={{ transitionDelay: "0.15s" }}>
          <div className="city-card city-card-large">
            <img
              src="https://images.unsplash.com/photo-1618517047922-d2e80dbde5fc?w=1200&q=80&auto=format"
              alt="Lagos Nigeria"
              loading="lazy"
            />
            <div className="city-label">
              <div className="city-name">Lagos</div>
              <div className="city-status">● Live now · 40,000+ drivers</div>
            </div>
          </div>
          <div className="city-card">
            <img
              src="https://images.unsplash.com/photo-1562778612-e1e0cda9915c?w=700&q=80&auto=format"
              alt="Abuja Nigeria"
              loading="lazy"
            />
            <div className="city-label">
              <div className="city-name">Abuja</div>
              <div className="city-status">● Live now · 18,000+ drivers</div>
            </div>
          </div>
          <div className="city-card">
            <img
              src="https://images.unsplash.com/photo-1612548403247-aa2873e9422d?w=700&q=80&auto=format"
              alt="Accra Ghana"
              loading="lazy"
            />
            <div className="city-label">
              <div className="city-name">Accra</div>
              <div className="city-status">● Live now</div>
            </div>
          </div>
          <div className="city-card">
            <img
              src="https://images.unsplash.com/photo-1547481887-a26e2cacb9df?w=700&q=80&auto=format"
              alt="Nairobi Kenya"
              loading="lazy"
            />
            <div className="city-label">
              <div className="city-name">Nairobi</div>
              <div className="city-status">◐ Coming Q3 2026</div>
            </div>
          </div>
          <div className="city-card">
            <img
              src="https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=700&q=80&auto=format"
              alt="Cape Town South Africa"
              loading="lazy"
            />
            <div className="city-label">
              <div className="city-name">Cape Town</div>
              <div className="city-status">◐ Coming Q4 2026</div>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <div className="reveal" style={{ textAlign: "center" }}>
          <span className="section-label">What people say</span>
          <h2 className="section-title">
            Riders and drivers <em>love</em> Jala Ride
          </h2>
        </div>

        <div className="testi-grid reveal" style={{ transitionDelay: "0.15s" }}>
          {[
            {
              quote:
                "“I switched from Uber last year and I'm never going back. Pickups are faster, drivers are nicer, and the app actually works offline when my data is poor.”",
              name: "Amina Bello",
              role: "Rider · Lagos",
              img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&q=80&auto=format&fit=crop",
            },
            {
              quote:
                '"As a driver, the 15% commission is a game-changer. I made 28% more in my first month compared to what I was earning on other platforms. Plus daily payouts!"',
              name: "Emeka Okafor",
              role: "Driver · Abuja",
              img: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=80&h=80&q=80&auto=format&fit=crop",
            },
            {
              quote:
                '"The safety features give me real peace of mind when I ride late at night. The SOS button, the trip sharing — Jala Ride clearly thought about women riders."',
              name: "Ngozi Adeyemi",
              role: "Rider · Lagos",
              img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&q=80&auto=format&fit=crop",
            },
          ].map((t) => (
            <div key={t.name} className="testi-card">
              <div className="stars">★★★★★</div>
              <p className="testi-text">{t.quote}</p>
              <div className="testi-author">
                <img src={t.img} alt="" className="testi-avatar" />
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="download-section" id="download">
        <div className="download-text reveal">
          <span className="label-dark">Get started today</span>
          <h2>
            Your next ride is
            <br />
            3 taps away.
          </h2>
          <p>
            Download Jala Ride free on iOS and Android. Create your account in under 60 seconds — no credit card
            required to get started.
          </p>
          <div className="store-buttons">
            <a href="#" className="store-btn" aria-label="Download on the App Store">
              <div className="store-icon">🍎</div>
              <div className="store-info">
                <span className="small">DOWNLOAD ON THE</span>
                <span className="big">App Store</span>
              </div>
            </a>
            <a href="#" className="store-btn" aria-label="Get it on Google Play">
              <div className="store-icon">▶</div>
              <div className="store-info">
                <span className="small">GET IT ON</span>
                <span className="big">Google Play</span>
              </div>
            </a>
          </div>
        </div>

        <div className="download-img reveal" style={{ transitionDelay: "0.2s" }}>
          <img
            src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=900&q=80&auto=format"
            alt="Jala Ride app on smartphone"
          />
        </div>
      </div>

      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#home" className="logo">
              TRIVE<span>X</span>A
            </a>
            <p>
              The ride-hailing platform built for the next generation — smarter trips, better earnings, and
              safety you can feel.
            </p>
            <div className="footer-socials">
              <a href="#" className="social-btn" aria-label="X">
                𝕏
              </a>
              <a href="#" className="social-btn" aria-label="LinkedIn">
                in
              </a>
              <a href="#" className="social-btn" aria-label="Facebook">
                f
              </a>
              <a href="#" className="social-btn" aria-label="YouTube">
                ▶
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h5>Product</h5>
            <ul>
              <li>
                <a href="#how">How it works</a>
              </li>
              <li>
                <a href="#rides">Ride types</a>
              </li>
              <li>
                <a href="#rides">Pricing</a>
              </li>
              <li>
                <a href="#safety">Safety</a>
              </li>
              <li>
                <a href="#">Jala Ride for Business</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Drivers</h5>
            <ul>
              <li>
                <a href="#drivers">Sign up to drive</a>
              </li>
              <li>
                <a href="#drivers">Earnings</a>
              </li>
              <li>
                <a href="#">Vehicle requirements</a>
              </li>
              <li>
                <a href="#">Driver support</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Company</h5>
            <ul>
              <li>
                <a href="#">About us</a>
              </li>
              <li>
                <a href="#">Careers</a>
              </li>
              <li>
                <a href="#">Press</a>
              </li>
              <li>
                <a href="#">Blog</a>
              </li>
              <li>
                <a href="#">Contact</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Jala Ride Technologies Ltd. All rights reserved.</span>
          <div style={{ display: "flex", gap: "2rem" }}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
