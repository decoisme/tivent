'use client';

import './home.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletButton } from '@/components/WalletButton';
import { MobileMenu } from '@/components/MobileMenu';
import { NetworkWarning } from '@/components/NetworkWarning';
import { TestnetBadge } from '@/components/TestnetBadge';
import KineticGrid from '@/components/ui/kinetic-grid';
import {
  Activity,
  ArrowLeftRight,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Menu,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Shield,
  Ticket,
  TicketCheck,
  Wallet,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <KineticGrid>
      <NetworkWarning />

      <nav className="home-nav fixed top-0 left-0 right-0 z-60">
        <div className="home-shell flex h-19 items-center justify-between">
          <div className="flex items-center gap-12">
            <button aria-label="Tivent home" onClick={() => router.push('/')} className="shrink-0">
              <img src="/tivent-logo.png" alt="Tivent" className="h-8 w-auto" />
            </button>
            <div className="hidden items-center gap-8 md:flex">
              <button onClick={() => router.push('/events')} className="home-nav-link home-nav-link-active">Discover</button>
              <button onClick={() => router.push('/tickets')} className="home-nav-link">My tickets</button>
              <button onClick={() => router.push('/marketplace')} className="home-nav-link">Resale</button>
              <button onClick={() => router.push('/organizer')} className="home-nav-link">For organizers</button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button aria-label="Notifications" className="home-icon-button hidden sm:inline-flex"><Bell size={17} /></button>
            <WalletButton />
            <button onClick={() => router.push('/organizer/events/new')} className="home-create-button hidden sm:inline-flex">
              <Plus size={16} /> Create event
            </button>
            <button onClick={() => setMobileMenuOpen(true)} className="home-icon-button md:hidden" aria-label="Open menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="home-page relative min-h-screen pt-19">
        <div className="relative z-10">
          <section className="home-shell home-hero-section">
            <div className="home-hero-copy">
              <div className="home-eyebrow"><span className="home-live-dot" /> THE NEXT GENERATION OF LIVE EVENTS</div>
              <h1>Make it a night <span>to remember.</span></h1>
              <p className="home-hero-description">Find your people. Feel the moment. Your next unforgettable event starts here—with tickets you can actually trust.</p>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => router.push('/events')} className="home-button-primary">
                  <Search size={17} /> Explore events <ArrowRight size={16} />
                </button>
                <button onClick={() => router.push('/marketplace')} className="home-button-secondary">
                  <ArrowLeftRight size={17} /> Browse resale
                </button>
              </div>
              <div className="home-trust-row">
                <div className="home-avatar-stack" aria-hidden="true"><span>J</span><span>M</span><span>A</span><span><Check size={12} /></span></div>
                <p><strong>Every ticket verified.</strong><br />Every moment yours.</p>
              </div>
            </div>

            <div className="home-visual" aria-label="Illustrated event ticket">
              <div className="home-orbit home-orbit-one" />
              <div className="home-orbit home-orbit-two" />
              <div className="home-ticket-card">
                <div className="home-ticket-topline"><span>YOUR NIGHT, YOUR PASS</span><span className="home-ticket-status"><i /> VERIFIED</span></div>
                <div className="home-ticket-art">
                  <div className="home-art-sun" />
                  <div className="home-art-hill home-art-hill-back" />
                  <div className="home-art-hill home-art-hill-front" />
                  <span className="home-art-star star-one">✳</span><span className="home-art-star star-two">✳</span>
                  <div className="home-art-caption"><span>LIVE • LOUD • TOGETHER</span><strong>FEEL<br />EVERYTHING.</strong></div>
                </div>
                <div className="home-ticket-info">
                  <div><span className="home-ticket-label">YOUR DIGITAL PASS</span><strong>Good times, guaranteed.</strong></div>
                  <div className="home-qr"><QrCode size={38} strokeWidth={1.6} /></div>
                </div>
                <div className="home-ticket-perforation"><span /><span /></div>
                <div className="home-ticket-footer"><span><CalendarDays size={14} /> ANY EVENT. ANY NIGHT.</span><span>NO. 0001</span></div>
              </div>
              <div className="home-floating-pill"><span className="home-pill-icon"><Shield size={16} /></span><span><strong>Proof, not promises</strong><small>Secured on-chain</small></span></div>
              <div className="home-visual-note">A better way to show up.</div>
            </div>
          </section>

          <section className="home-shell home-proof-strip" aria-label="Tivent highlights">
            <div className="home-proof-intro"><span>MADE FOR THE MOMENTS</span><strong>Worth showing up for.</strong></div>
            <div className="home-proof-item"><TicketCheck size={19} /><span>Real tickets.<br /><strong>Real ownership.</strong></span></div>
            <div className="home-proof-item"><RefreshCw size={19} /><span>Fresh QR codes.<br /><strong>Peace of mind.</strong></span></div>
            <div className="home-proof-item"><ArrowLeftRight size={19} /><span>Fair resale.<br /><strong>No scalper games.</strong></span></div>
          </section>

          <section className="home-shell home-features-section">
            <div className="home-section-heading">
              <div><span className="home-section-kicker">GOOD NIGHTS, BETTER TICKETS</span><h2>All the fun.<br /><em>None of the guesswork.</em></h2></div>
              <button onClick={() => router.push('/events')} className="home-text-link">See what’s happening <ArrowRight size={16} /></button>
            </div>
            <div className="home-feature-grid">
              <article className="home-feature-card home-feature-card-main">
                <div className="home-feature-icon home-feature-icon-orange"><Shield size={21} /></div>
                <span className="home-feature-number">01 / OWN IT</span>
                <h3>Your ticket.<br />Your name on it.</h3>
                <p>Every ticket is verifiably yours, secured as a digital asset. No fakes, no awkward surprises at the door.</p>
                <div className="home-feature-decoration home-deco-check"><CheckCircle2 size={24} /></div>
              </article>
              <article className="home-feature-card home-feature-card-lime">
                <div className="home-feature-icon home-feature-icon-dark"><ArrowLeftRight size={21} /></div>
                <span className="home-feature-number">02 / PASS IT ON</span>
                <h3>Plans change.<br />Fairness doesn’t.</h3>
                <p>Give someone else their big night with resale rules designed to keep prices fair.</p>
                <div className="home-feature-decoration home-deco-arrows"><ArrowLeftRight size={52} /></div>
              </article>
              <article className="home-feature-card home-feature-card-purple">
                <div className="home-feature-icon home-feature-icon-dark"><QrCode size={21} /></div>
                <span className="home-feature-number">03 / SHOW UP</span>
                <h3>One scan.<br />Straight inside.</h3>
                <p>Your pass refreshes with a dynamic QR code, ready for a quick, verified check at the gate.</p>
                <div className="home-feature-decoration home-deco-qr"><QrCode size={65} /></div>
              </article>
            </div>
          </section>

          <section className="home-journey-wrap">
            <div className="home-shell home-journey-section">
              <div className="home-journey-copy">
                <span className="home-section-kicker">FROM “I’M IN” TO “I WAS THERE”</span>
                <h2>Four little steps.<br /><em>One big night.</em></h2>
                <p>We take care of the ticket stuff, so you can focus on the part that matters: being there.</p>
                <button onClick={() => router.push('/events')} className="home-button-primary">Find your next event <ArrowRight size={16} /></button>
              </div>
              <div className="home-journey-steps">
                {[
                  { icon: <Search size={18} />, title: 'Find your thing', desc: 'Explore events and choose your next experience.' },
                  { icon: <Wallet size={18} />, title: 'Make it yours', desc: 'Get your ticket with secure, straightforward checkout.' },
                  { icon: <Ticket size={18} />, title: 'Keep your pass', desc: 'Your ticket stays yours, with proof of ownership.' },
                  { icon: <CheckCircle2 size={18} />, title: 'Walk right in', desc: 'Show your dynamic pass for verified entry.' },
                ].map((step, index) => (
                  <div className="home-journey-step" key={step.title}>
                    <div className="home-step-icon">{step.icon}</div>
                    <div className="home-step-copy"><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.desc}</p></div>
                    {index < 3 && <div className="home-step-line" />}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="home-shell home-cta-section">
            <div className="home-cta-card">
              <div className="home-cta-decoration">✳</div>
              <div><span className="home-section-kicker">YOUR PEOPLE ARE OUT THERE</span><h2>Let’s make a night of it.</h2><p>Find the event you’ll still be talking about next week.</p></div>
              <button onClick={() => router.push('/events')} className="home-button-dark">Explore events <ArrowRight size={16} /></button>
            </div>
          </section>

          <footer className="home-footer">
            <div className="home-shell">
              <div className="home-footer-main">
                <div className="home-footer-brand"><img src="/tivent-logo.png" alt="Tivent" className="h-7 w-auto" /><p>Better nights start with a better ticket.</p><span className="home-network-label"><Activity size={13} /> Polygon Amoy Network <i /> TESTNET</span></div>
                <div className="home-footer-links">
                  <div><span>EXPLORE</span><button onClick={() => router.push('/events')}>Events</button><button onClick={() => router.push('/marketplace')}>Resale market</button><button onClick={() => router.push('/tickets')}>My tickets</button></div>
                  <div><span>MAKE IT HAPPEN</span><button onClick={() => router.push('/organizer/events/new')}>Create an event</button><button onClick={() => router.push('/partner')}>Partner with us</button><button onClick={() => router.push('/gate')}>Gate scanner</button></div>
                </div>
              </div>
              <div className="home-footer-bottom"><span>© 2026 Tivent. Here for the moments.</span><span><CheckCircle2 size={14} /> Blockchain-verified ticketing</span></div>
            </div>
          </footer>
          <TestnetBadge />
        </div>
      </main>
    </KineticGrid>
  );
}
