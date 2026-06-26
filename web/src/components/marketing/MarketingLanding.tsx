import {
  ArrowRight,
  Bike,
  Car,
  CarFront,
  CheckCircle2,
  Download,
  Shield,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";

const categories = [
  { name: "Economy", icon: Car, band: "₦300 base + ₦80/km", desc: "Affordable everyday rides" },
  { name: "Comfort", icon: CarFront, band: "₦500 base + ₦120/km", desc: "Premium sedans" },
  { name: "XL", icon: Truck, band: "₦700 base + ₦150/km", desc: "Groups & luggage" },
  { name: "Moto", icon: Bike, band: "₦150 base + ₦50/km", desc: "Quick city hops" },
];

const riderSteps = [
  "Register with your NIN",
  "Book a ride in seconds",
  "Track your driver live",
  "Share your ride card for safety",
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

export function MarketingLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-16 md:px-12 md:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-background" />
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-accent">
              JR
            </div>
            <span className="text-xl font-bold">Jala Ride</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="#download"
              className="rounded-lg border border-primary/50 px-4 py-2 text-sm font-medium text-text-primary hover:bg-primary/10"
            >
              Download
            </Link>
            <Link
              href="/admin"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Admin
            </Link>
          </div>
        </nav>
        <div className="relative z-10 mx-auto mt-16 max-w-4xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
            Government-aligned mobility
          </p>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Move with Confidence.
            <br />
            <span className="text-primary">Powered by Jala Ride.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">
            Nigeria&apos;s identity-verified, government-fleet ride-hailing platform. Every driver
            NIN-verified, DSS-cleared, and police-screened.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="#download"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-semibold text-white hover:bg-primary/90"
            >
              Download Rider App
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="#drivers"
              className="inline-flex items-center gap-2 rounded-xl border border-accent/50 bg-surface px-8 py-4 font-semibold text-accent hover:bg-accent/10"
            >
              Become a Driver
            </a>
          </div>
        </div>
      </section>

      {/* How It Works — Riders */}
      <section className="border-t border-white/5 bg-surface/50 px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold">How It Works for Riders</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {riderSteps.map((step, i) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-surface p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-accent">
                  {i + 1}
                </div>
                <p className="font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — Drivers */}
      <section id="drivers" className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold">How It Works for Drivers</h2>
          <p className="mt-2 text-text-secondary">
            Drive government-assigned vehicles with transparent weekly remittance.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {driverSteps.map((step, i) => (
              <div key={step} className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                  {i + 1}
                </div>
                <p className="font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="border-t border-white/5 bg-surface/50 px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-accent" />
            <h2 className="text-3xl font-bold">Built for Safety</h2>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {safetyFeatures.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <span className="text-text-secondary">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold">Vehicle Categories</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(({ name, icon: Icon, band, desc }) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-surface p-6 text-center">
                <Icon className="mx-auto h-10 w-10 text-accent" />
                <h3 className="mt-4 text-xl font-semibold">{name}</h3>
                <p className="mt-1 text-sm text-accent">{band}</p>
                <p className="mt-2 text-sm text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="border-t border-white/5 bg-surface px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <Download className="mx-auto h-12 w-12 text-accent" />
          <h2 className="mt-6 text-3xl font-bold">Get the Apps</h2>
          <p className="mx-auto mt-4 max-w-xl text-text-secondary">
            Available on Google Play and the App Store. Verify your NIN and start riding in minutes.
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 p-8">
              <Users className="mx-auto h-8 w-8 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">Jala Ride — Rider</h3>
              <div className="mt-6 flex justify-center gap-4">
                <a href="#" className="rounded-lg bg-white/10 px-6 py-3 text-sm font-medium hover:bg-white/20">
                  Google Play
                </a>
                <a href="#" className="rounded-lg bg-white/10 px-6 py-3 text-sm font-medium hover:bg-white/20">
                  App Store
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8">
              <Car className="mx-auto h-8 w-8 text-accent" />
              <h3 className="mt-4 text-xl font-semibold">Jala Ride Driver</h3>
              <div className="mt-6 flex justify-center gap-4">
                <a href="#" className="rounded-lg bg-white/10 px-6 py-3 text-sm font-medium hover:bg-white/20">
                  Google Play
                </a>
                <a href="#" className="rounded-lg bg-white/10 px-6 py-3 text-sm font-medium hover:bg-white/20">
                  App Store
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-12 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-accent">
                JR
              </div>
              <span className="font-bold">Jala Ride</span>
            </div>
            <p className="mt-2 text-sm text-text-secondary">
              © {new Date().getFullYear()} Jala Ride Technologies Ltd.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-text-secondary">
            <a href="#" className="hover:text-text-primary">About</a>
            <a href="#" className="hover:text-text-primary">Safety</a>
            <a href="#" className="hover:text-text-primary">Driver FAQ</a>
            <a href="#" className="hover:text-text-primary">Privacy Policy</a>
            <a href="#" className="hover:text-text-primary">Terms</a>
          </div>
          <div className="flex gap-4 text-sm text-text-secondary">
            <a href="#" className="hover:text-text-primary">Twitter/X</a>
            <a href="#" className="hover:text-text-primary">Instagram</a>
            <a href="#" className="hover:text-text-primary">Facebook</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
