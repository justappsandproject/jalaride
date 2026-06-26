"use client";

import { appDownloads } from "@/lib/app-downloads";
import {
  ArrowRight,
  Bike,
  Car,
  CarFront,
  CheckCircle2,
  Download,
  MapPin,
  Shield,
  Smartphone,
  Sparkles,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const categories = [
  { name: "Economy", icon: Car, band: "₦300 base + ₦80/km", desc: "Affordable everyday rides", color: "from-green-600/30" },
  { name: "Comfort", icon: CarFront, band: "₦500 base + ₦120/km", desc: "Premium sedans", color: "from-amber-600/30" },
  { name: "XL", icon: Truck, band: "₦700 base + ₦150/km", desc: "Groups & luggage", color: "from-blue-600/30" },
  { name: "Moto", icon: Bike, band: "₦150 base + ₦50/km", desc: "Quick city hops", color: "from-purple-600/30" },
];

const riderSteps = [
  { title: "Register with NIN", desc: "Verify your identity in minutes", icon: Shield },
  { title: "Book a ride", desc: "Pick category, confirm fare", icon: Smartphone },
  { title: "Track live", desc: "See your driver on the map", icon: MapPin },
  { title: "Share ride card", desc: "Family can follow your trip", icon: Users },
];

const driverSteps = [
  "Register with NIN + documents",
  "DSS & Police clearance check",
  "Get assigned a government vehicle",
  "Earn and remit weekly",
];

const safetyFeatures = [
  "NIN-backed identity for every user",
  "DSS security clearance for all drivers",
  "Police background check mandatory",
  "Live trip sharing with emergency contacts",
  "SOS button with location broadcast",
];

const stats = [
  { label: "Verified drivers", value: "100%", suffix: "" },
  { label: "Cities launching", value: "12", suffix: "+" },
  { label: "Avg. pickup", value: "4", suffix: " min" },
  { label: "Safety rating", value: "4.9", suffix: "★" },
];

function useCounter(end: number, duration = 2000, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = end / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(id);
      } else setCount(Math.floor(start * 10) / 10);
    }, 16);
    return () => clearInterval(id);
  }, [end, duration, active]);
  return count;
}

function StatCard({ label, value, suffix, active }: { label: string; value: string; suffix: string; active: boolean }) {
  const num = parseFloat(value);
  const counted = useCounter(num, 1800, active);
  const display = Number.isInteger(num) ? Math.round(counted) : counted.toFixed(1);
  return (
    <div className="card-hover rounded-2xl border border-white/10 bg-surface/80 p-6 text-center backdrop-blur">
      <p className="text-3xl font-bold text-accent">
        {display}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-text-secondary">{label}</p>
    </div>
  );
}

export function MarketingLanding() {
  const [statsVisible, setStatsVisible] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setStatsVisible(true),
      { threshold: 0.3 }
    );
    const el = document.getElementById("stats-section");
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Hero */}
      <section
        className="relative min-h-[92vh] overflow-hidden px-6 pb-24 pt-10 md:px-12"
        onMouseMove={(e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/40 via-background to-background" />
        <div
          className="pointer-events-none absolute -right-20 top-20 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl animate-pulse-glow"
          style={{ transform: `translate(${mouse.x * 20}px, ${mouse.y * 20}px)` }}
        />
        <div
          className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-accent/15 blur-3xl animate-pulse-glow"
          style={{ animationDelay: "1.5s", transform: `translate(${-mouse.x * 15}px, ${-mouse.y * 15}px)` }}
        />

        {/* Animated road */}
        <div className="pointer-events-none absolute bottom-24 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div className="pointer-events-none absolute bottom-20 left-0 animate-drive opacity-30">
          <Car className="h-8 w-8 text-accent" />
        </div>

        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary font-bold text-accent shadow-lg shadow-primary/40">
              JR
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent animate-flash" />
            </div>
            <span className="text-xl font-bold">Jala Ride</span>
          </div>
          <div className="flex gap-3">
            <Link href="#download" className="card-hover rounded-lg border border-primary/50 px-4 py-2 text-sm font-medium hover:border-accent/50 hover:bg-primary/10">
              Download
            </Link>
            <Link href="/admin" className="card-hover rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30 hover:bg-primary/90">
              Admin
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto mt-12 grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:mt-16">
          <div>
            <p className="animate-slide-up mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent">
              <Sparkles className="h-4 w-4" />
              Government-aligned mobility
            </p>
            <h1 className="animate-slide-up stagger-1 text-4xl font-bold leading-tight opacity-0 md:text-6xl">
              Move with{" "}
              <span className="gradient-text animate-shimmer">Confidence.</span>
              <br />
              <span className="text-primary">Powered by Jala Ride.</span>
            </h1>
            <p className="animate-slide-up stagger-2 mt-6 max-w-xl text-lg text-text-secondary opacity-0">
              Nigeria&apos;s identity-verified, government-fleet ride-hailing platform. Every driver
              NIN-verified, DSS-cleared, and police-screened.
            </p>
            <div className="animate-slide-up stagger-3 mt-10 flex flex-wrap gap-4 opacity-0">
              <a href="#download" className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-semibold text-white shadow-xl shadow-primary/40 transition hover:scale-105 hover:bg-primary/90">
                Download Rider App
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </a>
              <a href="#drivers" className="inline-flex items-center gap-2 rounded-xl border border-accent/50 bg-surface/80 px-8 py-4 font-semibold text-accent backdrop-blur transition hover:scale-105 hover:bg-accent/10">
                Become a Driver
              </a>
            </div>
            <div className="animate-slide-up stagger-4 mt-8 flex flex-wrap gap-4 opacity-0">
              {["NIN Verified", "DSS Cleared", "Live Tracking"].map((badge) => (
                <span key={badge} className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="animate-float relative mx-auto aspect-square max-w-sm">
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-spin-slow" />
              <div className="absolute inset-4 rounded-full border border-dashed border-accent/30 animate-spin-slow" style={{ animationDirection: "reverse" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-64 w-64 overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-2xl shadow-primary/30 md:h-72 md:w-72">
                  <Image
                    src="/images/hero-app.svg"
                    alt="Jala Ride app preview"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-background/90 p-3 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/30 flex items-center justify-center">
                        <Car className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Driver arriving</p>
                        <p className="text-xs text-accent">ETA 3 min · DSS ✅</p>
                      </div>
                      <Zap className="ml-auto h-5 w-5 text-accent animate-flash" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="animate-float-delayed absolute -right-4 top-8 rounded-2xl border border-white/10 bg-surface p-3 shadow-xl">
                <Shield className="h-8 w-8 text-success" />
              </div>
              <div className="animate-float absolute -left-6 bottom-16 rounded-2xl border border-accent/30 bg-accent/10 p-3 shadow-xl">
                <p className="text-2xl font-bold text-accent">₦1,200</p>
                <p className="text-xs text-text-secondary">Est. fare</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats-section" className="border-y border-white/5 bg-surface/30 px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} active={statsVisible} />
          ))}
        </div>
      </section>

      {/* How It Works — Riders */}
      <section className="relative px-6 py-20 md:px-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]">
          <Image src="/images/pattern-grid.svg" alt="" fill className="object-cover" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold md:text-4xl">
            How It Works for <span className="text-primary">Riders</span>
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {riderSteps.map((step, i) => (
              <div
                key={step.title}
                className="card-hover group rounded-2xl border border-white/10 bg-surface p-6"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-accent transition group-hover:bg-primary group-hover:text-white">
                  <step.icon className="h-6 w-6" />
                </div>
                <p className="text-lg font-semibold">{step.title}</p>
                <p className="mt-2 text-sm text-text-secondary">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Drivers */}
      <section id="drivers" className="border-t border-white/5 bg-gradient-to-b from-primary/10 to-background px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Drive with Purpose</h2>
            <p className="mt-4 text-text-secondary">
              Government-assigned vehicles, transparent weekly remittance, and full clearance support.
            </p>
            <div className="mt-10 space-y-4">
              {driverSteps.map((step, i) => (
                <div key={step} className="card-hover flex items-center gap-4 rounded-xl border border-primary/20 bg-surface/80 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">
                    {i + 1}
                  </div>
                  <p className="font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-12 lg:mt-0">
            <div className="animate-float relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <Image src="/images/driver-fleet.svg" alt="Jala Ride driver fleet" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="border-t border-white/5 bg-surface/50 px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className="relative order-2 lg:order-1">
            <div className="animate-pulse-glow absolute -inset-4 rounded-3xl bg-success/10 blur-2xl" />
            <Image src="/images/safety-shield.svg" alt="Safety features" width={480} height={400} className="relative mx-auto w-full max-w-md" />
          </div>
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3">
              <Shield className="h-10 w-10 text-accent" />
              <h2 className="text-3xl font-bold md:text-4xl">Built for Safety</h2>
            </div>
            <ul className="mt-10 space-y-4">
              {safetyFeatures.map((f) => (
                <li key={f} className="card-hover flex items-start gap-3 rounded-lg p-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span className="text-text-secondary">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Vehicle Categories</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-text-secondary">
            From quick moto hops to XL family trips — transparent pricing for every journey.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(({ name, icon: Icon, band, desc, color }) => (
              <div key={name} className={`card-hover rounded-2xl border border-white/10 bg-gradient-to-br ${color} to-surface p-6 text-center`}>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
                  <Icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">{name}</h3>
                <p className="mt-1 text-sm font-medium text-accent">{band}</p>
                <p className="mt-2 text-sm text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="relative overflow-hidden border-t border-white/5 bg-surface px-6 py-24 md:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl text-center">
          <Download className="mx-auto h-14 w-14 text-accent animate-float" />
          <h2 className="mt-6 text-3xl font-bold md:text-4xl">Get the Apps</h2>
          <p className="mx-auto mt-4 max-w-xl text-text-secondary">
            Download directly for Android. iOS coming soon on the App Store.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="card-hover rounded-2xl border border-white/10 bg-background/50 p-8 backdrop-blur">
              <Users className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">Jala Ride — Rider</h3>
              <p className="mt-2 text-sm text-text-secondary">Book verified rides across Nigeria</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href={appDownloads.riderApk}
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:scale-105"
                >
                  <Download className="h-4 w-4" />
                  Download APK
                </a>
                <a
                  href={appDownloads.riderAab}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-medium transition hover:bg-white/10"
                >
                  Download AAB (Play Store)
                </a>
              </div>
            </div>
            <div className="card-hover rounded-2xl border border-primary/30 bg-primary/10 p-8 backdrop-blur">
              <Car className="mx-auto h-10 w-10 text-accent" />
              <h3 className="mt-4 text-xl font-semibold">Jala Ride Driver</h3>
              <p className="mt-2 text-sm text-text-secondary">Drive fleet vehicles & manage remittance</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href={appDownloads.driverApk}
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-background shadow-lg shadow-accent/30 transition hover:scale-105"
                >
                  <Download className="h-4 w-4" />
                  Download APK
                </a>
                <a
                  href={appDownloads.driverAab}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/40 px-6 py-3 text-sm font-medium text-accent transition hover:bg-accent/10"
                >
                  Download AAB (Play Store)
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-12 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-accent">JR</div>
              <span className="font-bold">Jala Ride</span>
            </div>
            <p className="mt-2 text-sm text-text-secondary">© {new Date().getFullYear()} Jala Ride Technologies Ltd.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-text-secondary">
            <a href="#download" className="hover:text-accent transition">Download</a>
            <a href="#drivers" className="hover:text-accent transition">Drive with us</a>
            <Link href="/admin" className="hover:text-accent transition">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
