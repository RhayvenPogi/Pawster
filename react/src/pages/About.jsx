import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from "../images/logo.png";
import { usePageTitle } from "../hooks/usePageTitle";

function useReveal() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, vis];
}
function Reveal({ children, delay = 0 }) {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} style={{ transition: 'opacity 0.7s ease, transform 0.7s ease', transitionDelay: delay + 'ms', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)' }}>
      {children}
    </div>
  );
}

const VALUES = [
  {
    icon: 'fas fa-shield-dog',
    color: '#c03060',
    bg: 'rgba(192,48,96,0.11)',
    title: 'Responsible Screening',
    desc: 'Every adoption request goes through a thorough questionnaire and review process to ensure animals are placed in truly prepared, loving homes.'
  },
  {
    icon: 'fas fa-shield-alt',
    color: '#2060a0',
    bg: 'rgba(32,96,160,0.11)',
    title: 'Animal Welfare First',
    desc: 'We fight against poorly matched adoptions and animals left without a home. Every decision on the platform prioritizes the long-term safety and happiness of the animal.'
  },
  {
    icon: 'fas fa-comments',
    color: '#1c4f09',
    bg: 'rgba(28,79,9,0.12)',
    title: 'Post-Adoption Support',
    desc: 'Adoption doesn\'t end at signing. We schedule check-ins at 7, 30, and 90 days and maintain an open messaging channel between adopters and rescue coordinators.'
  },
  {
    icon: 'fas fa-map-marker-alt',
    color: '#d4880a',
    bg: 'rgba(212,136,10,0.12)',
    title: 'Locally Rooted',
    desc: 'We serve Baguio City and the Cordillera Administrative Region — with location-aware matching that connects adopters to rescuers and coordinators nearby.'
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: 'fas fa-user-plus',
    title: 'Register & Verify',
    desc: 'Create your account and upload a government-issued ID. Verified profiles build trust across the entire adoption community.'
  },
  {
    step: '02',
    icon: 'fas fa-clipboard-list',
    title: 'Complete the Questionnaire',
    desc: 'Answer questions about your living situation, pet experience, time availability, and financial readiness — so we can match the right animal to you.'
  },
  {
    step: '03',
    icon: 'fas fa-paw',
    title: 'Submit Your Adoption Request',
    desc: 'Browse available animals and submit a formal request. Rescue coordinators connected to the platform review and respond directly through Pawster.'
  },
  {
    step: '04',
    icon: 'fas fa-heart',
    title: 'Adopt & Stay Connected',
    desc: 'After adoption, scheduled check-ins keep communication open. Submit photo updates, vet visit confirmations, and message your coordinator anytime.'
  },
];

const USER_TYPES = [
  {
    icon: 'fas fa-user',
    color: '#1c4f09',
    bg: 'rgba(28,79,9,0.10)',
    title: 'Individuals & Families',
    items: [
      'Browse animals available for adoption',
      'Submit pre-screened adoption requests',
      'Track adoption application status',
      'Complete scheduled post-adoption check-ins',
      'Submit a rehome & rescue request through the platform',
      'Communicate with rescue coordinators via in-app messaging',
    ]
  },
  {
    icon: 'fas fa-hands-holding-heart',
    color: '#B45A22',
    bg: 'rgba(180,90,34,0.10)',
    title: 'Rescue Coordinators',
    items: [
      'Post and manage animal listings',
      'Review and approve adoption applications',
      'Review user-submitted rehome & rescue requests',
      'Conduct and track post-adoption check-ins',
      'Communicate with adopters via secure messaging',
      'Access full adoption history and feedback records',
    ]
  },
];

const STATS = [
  ['100%', 'Screened adoptions'],
  ['CAR', 'Region served'],
  ['3×', 'Post-adoption check-ins'],
  ['2025', 'Platform launched'],
];

export default function About() {
  const { user, logout } = useAuth();

  usePageTitle('About Us');
  return (
    <div style={{ minHeight: '100vh', background: '#EDDABB', fontFamily: "'Nunito',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:wght@400;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes fl1{0%,100%{transform:translate(0,0)}50%{transform:translate(5%,8%)}}
        @keyframes fl2{0%,100%{transform:translate(0,0)}50%{transform:translate(-8%,5%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        *,*::before,*::after{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#eddabb}::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}
      `}</style>

      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#EDDABB' }} />
        <div style={{ position: 'absolute', width: 900, height: 900, top: '-20%', left: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#588B41,transparent 70%)', filter: 'blur(120px)', opacity: 0.42, animation: 'fl1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 800, height: 800, bottom: '-15%', right: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#B45A22,transparent 70%)', filter: 'blur(120px)', opacity: 0.35, animation: 'fl2 11s ease-in-out infinite' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1100, margin: '0 auto', padding: '4rem 2.5rem 6rem' }}>

        {/* ── Hero ── */}
        <Reveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
            <i className="fas fa-info-circle" style={{ fontSize: '0.65rem' }} /> Our Story
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '5rem' }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2.2rem,4vw,3.4rem)', fontWeight: 900, color: '#1a4a08', lineHeight: 1.1, marginBottom: '1.25rem' }}>
                About <em style={{ fontStyle: 'italic', color: '#e07820' }}>Pawster</em>
              </h1>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3a5020', lineHeight: 1.8, marginBottom: '1rem' }}>
                Pawster is a digital platform that connects adopters, rescuers, and rescue coordinators across Baguio City and the Cordillera Administrative Region — making animal adoption more organized, transparent, and accountable.
              </p>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#3a5020', lineHeight: 1.8, marginBottom: '1rem' }}>
                We are not a shelter. We are a middleman — a structured system that bridges the gap between people who want to give animals a home and the coordinators who facilitate those placements responsibly.
              </p>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#3a5020', lineHeight: 1.8 }}>
                From the first questionnaire to the 90-day check-in, Pawster guides and tracks every adoption so rescued animals find safe, permanent homes in the City of Pines and beyond.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
              {STATS.map(([val, lbl]) => (
                <div key={lbl} style={{ background: 'rgba(255,248,225,0.80)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 18, padding: '1.5rem', textAlign: 'center', boxShadow: '0 3px 14px rgba(100,70,20,0.10)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2.2rem', fontWeight: 900, color: '#1a4a08', lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6a7a50', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.4rem' }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── What Pawster Is (and Isn't) ── */}
        <Reveal delay={60}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(32,96,160,0.08)', border: '1px solid rgba(32,96,160,0.28)', color: '#2060a0' }}>
            <i className="fas fa-sitemap" style={{ fontSize: '0.65rem' }} /> Platform Role
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 900, color: '#1a4a08', marginBottom: '1rem' }}>What Pawster Is — and Isn't</h2>
          <div style={{ background: 'rgba(255,248,225,0.80)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, padding: '2.25rem', boxShadow: '0 3px 14px rgba(100,70,20,0.10)', marginBottom: '5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {[
                {
                  icon: 'fas fa-check-circle', color: '#1c7a09',
                  title: 'A digital adoption platform',
                  desc: 'Pawster is an online system that organizes, screens, and tracks the full adoption process — from application to post-adoption check-ins.'
                },
                {
                  icon: 'fas fa-check-circle', color: '#1c7a09',
                  title: 'A bridge between people and coordinators',
                  desc: 'We connect adopters and rehomers to rescue coordinators who manage listings and facilitate placements — all through one structured platform.'
                },
                {
                  icon: 'fas fa-times-circle', color: '#c03060',
                  title: 'Not a shelter or rescue organization',
                  desc: 'Pawster does not house, physically care for, or rescue animals directly. We provide the digital infrastructure for those who do.'
                },
                {
                  icon: 'fas fa-times-circle', color: '#c03060',
                  title: 'Not affiliated with any specific shelter',
                  desc: 'Pawster is an independent platform. Rescue coordinators who use our system operate independently and are responsible for their own animal care.'
                },
              ].map(({ icon, color, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                    <i className={icon} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1a4a08', marginBottom: '0.3rem' }}>{title}</div>
                    <p style={{ fontSize: '0.83rem', fontWeight: 700, color: '#6a7a50', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── The Problem We Solve ── */}
        <Reveal delay={80}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(192,48,96,0.08)', border: '1px solid rgba(192,48,96,0.28)', color: '#c03060' }}>
            <i className="fas fa-exclamation-circle" style={{ fontSize: '0.65rem' }} /> The Problem
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 900, color: '#1a4a08', marginBottom: '1rem' }}>Why Pawster Exists</h2>
          <div style={{ background: 'rgba(255,248,225,0.80)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, padding: '2.25rem', boxShadow: '0 3px 14px rgba(100,70,20,0.10)', marginBottom: '5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {[
                { icon: 'fas fa-undo', color: '#c03060', title: 'High Return Rates', desc: 'Animals are returned when adopters realize they weren\'t ready — often because there was no proper pre-adoption screening in place.' },
                { icon: 'fas fa-clipboard-question', color: '#B45A22', title: 'Manual & Inconsistent Screening', desc: 'Coordinators relying on paper-based or informal processes can\'t reliably evaluate adopter readiness, leading to mismatched placements.' },
                { icon: 'fas fa-unlink', color: '#2060a0', title: 'No Centralized System', desc: 'Without a shared platform, rescuers, coordinators, and adopters in Baguio and CAR work in silos — making the process slow and hard to track.' },
                { icon: 'fas fa-eye-slash', color: '#6a3090', title: 'No Follow-Up After Adoption', desc: 'Once an animal is placed, most informal processes offer no way to monitor welfare or support the adopter through challenges.' },
              ].map(({ icon, color, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                    <i className={icon} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1a4a08', marginBottom: '0.3rem' }}>{title}</div>
                    <p style={{ fontSize: '0.83rem', fontWeight: 700, color: '#6a7a50', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Reference Partner ── */}
        <Reveal delay={60}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(180,90,34,0.08)', border: '1px solid rgba(180,90,34,0.28)', color: '#B45A22' }}>
            <i className="fas fa-handshake" style={{ fontSize: '0.65rem' }} /> Reference Partner
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 900, color: '#1a4a08', marginBottom: '1rem' }}>Built with Real-World Guidance</h2>
          <div style={{ background: 'rgba(255,248,225,0.80)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, padding: '2.25rem', boxShadow: '0 3px 14px rgba(100,70,20,0.10)', marginBottom: '5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(180,90,34,0.12)', color: '#B45A22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                <i className="fas fa-clinic-medical" />
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1a4a08', marginBottom: '0.3rem' }}>PetMedico Baguio</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#B45A22', marginBottom: '0.75rem' }}>
                  <i className="fas fa-map-marker-alt" style={{ marginRight: '0.35rem' }} />
                  Unit 3 Townhouse, Asin Road, Shangrila Village, Baguio City, CAR 2600
                </div>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#3a5020', lineHeight: 1.75, margin: 0 }}>
                  Pawster was developed using <strong>PetMedico Baguio</strong> as our reference partner. After visiting their organization and observing their day-to-day animal care processes, their real-world workflows directly shaped the features, screening criteria, and post-adoption tracking built into this platform. PetMedico is not connected to or managed through Pawster — they served as a guide to help us build a system that reflects genuine, responsible rescue practices in Baguio City.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── How It Works ── */}
        <Reveal delay={80}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
            <i className="fas fa-route" style={{ fontSize: '0.65rem' }} /> The Process
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 900, color: '#1a4a08', marginBottom: '1.5rem' }}>How Adoption Works on Pawster</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '1.1rem', marginBottom: '5rem' }}>
            {HOW_IT_WORKS.map(({ step, icon, title, desc }, i) => (
              <Reveal key={step} delay={i * 70}>
                <div style={{ background: 'rgba(255,248,225,0.80)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 18, padding: '1.75rem', boxShadow: '0 3px 14px rgba(100,70,20,0.10)', transition: 'transform 0.2s', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ position: 'absolute', top: '0.75rem', right: '1rem', fontFamily: "'Playfair Display',serif", fontSize: '2.4rem', fontWeight: 900, color: 'rgba(28,79,9,0.08)', lineHeight: 1 }}>{step}</div>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: 'rgba(28,79,9,0.10)', color: '#1c4f09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '1rem' }}>
                    <i className={icon} />
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1a4a08', marginBottom: '0.5rem' }}>{title}</div>
                  <p style={{ fontSize: '0.84rem', fontWeight: 700, color: '#6a7a50', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ── Post-Adoption Check-Ins ── */}
        <Reveal delay={80}>
          <div style={{ background: 'linear-gradient(135deg,rgba(28,79,9,0.10),rgba(90,170,48,0.07))', border: '1px solid rgba(90,170,48,0.35)', borderRadius: 24, padding: '2.75rem', marginBottom: '5rem', boxShadow: '0 6px 30px rgba(28,79,9,0.10)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(28,79,9,0.10)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
              <i className="fas fa-calendar-check" style={{ fontSize: '0.65rem' }} /> Post-Adoption
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', fontWeight: 900, color: '#1a4a08', marginBottom: '0.75rem' }}>We Don't Stop at Adoption Day</h2>
            <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#3a5020', lineHeight: 1.8, marginBottom: '2rem', maxWidth: 620 }}>
              Pawster schedules structured check-ins to make sure every animal is truly thriving after placement. Each check-in opens a private communication channel between the adopter and their rescue coordinator through the platform.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {[
                { day: 'Day 7', icon: 'fas fa-stethoscope', desc: 'Early adjustment check — settling in, vet visit status, and initial photos.' },
                { day: 'Day 30', icon: 'fas fa-comments', desc: 'One-month follow-up — behavioral progress, any concerns, and ongoing support.' },
                { day: 'Day 90', icon: 'fas fa-heart', desc: 'Three-month milestone — long-term welfare confirmation and adopter feedback record.' },
              ].map(({ day, icon, desc }) => (
                <div key={day} style={{ flex: '1 1 180px', background: 'rgba(255,250,232,0.75)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 16, padding: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(28,79,9,0.10)', color: '#1c4f09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                    <i className={icon} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1a4a08', marginBottom: '0.25rem' }}>{day}</div>
                    <p style={{ fontSize: '0.81rem', fontWeight: 700, color: '#6a7a50', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Values ── */}
        <Reveal delay={80}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
            <i className="fas fa-star" style={{ fontSize: '0.65rem' }} /> Core Values
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 900, color: '#1a4a08', marginBottom: '1.5rem' }}>What We Stand For</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1.1rem', marginBottom: '5rem' }}>
            {VALUES.map(({ icon, color, bg, title, desc }, i) => (
              <Reveal key={title} delay={i * 70}>
                <div style={{ background: 'rgba(255,248,225,0.80)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 18, padding: '1.75rem', boxShadow: '0 3px 14px rgba(100,70,20,0.10)', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '1rem' }}>
                    <i className={icon} />
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1a4a08', marginBottom: '0.5rem' }}>{title}</div>
                  <p style={{ fontSize: '0.84rem', fontWeight: 700, color: '#6a7a50', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ── Who It's For ── */}
        <Reveal delay={80}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
            <i className="fas fa-users" style={{ fontSize: '0.65rem' }} /> Who It's For
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 900, color: '#1a4a08', marginBottom: '1.5rem' }}>Built for Two Kinds of Heroes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '5rem' }}>
            {USER_TYPES.map(({ icon, color, bg, title, items }, i) => (
              <Reveal key={title} delay={i * 100}>
                <div style={{ background: 'rgba(255,248,225,0.80)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, padding: '2rem', boxShadow: '0 3px 14px rgba(100,70,20,0.10)', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 13, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                      <i className={icon} />
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#1a4a08' }}>{title}</div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {items.map(item => (
                      <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.6rem', fontSize: '0.84rem', fontWeight: 700, color: '#3a5020', lineHeight: 1.55 }}>
                        <i className="fas fa-check" style={{ color, marginTop: '0.2rem', flexShrink: 0, fontSize: '0.78rem' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ── The Team ── */}
        <Reveal delay={80}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(32,96,160,0.08)', border: '1px solid rgba(32,96,160,0.28)', color: '#2060a0' }}>
            <i className="fas fa-graduation-cap" style={{ fontSize: '0.65rem' }} /> The Team
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 900, color: '#1a4a08', marginBottom: '1rem' }}>Meet the Developers</h2>
          <div style={{ background: 'rgba(255,248,225,0.80)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, padding: '2.25rem', boxShadow: '0 3px 14px rgba(100,70,20,0.10)', marginBottom: '5rem' }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#3a5020', lineHeight: 1.75, marginBottom: '1.5rem' }}>
              Pawster was created by second-year BS Information Technology students from <strong>Lorma Colleges</strong> as a capstone project for Information Management 2, Application Development and Emerging Technologies, Integrative Programming Technologies, and IT Elective 1.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {[
                { name: 'Rhayven Jonas Alano', icon: 'fas fa-user-graduate', color: '#1c4f09', bg: 'rgba(28,79,9,0.10)' },
                { name: 'Roineill Genove', icon: 'fas fa-user-graduate', color: '#2060a0', bg: 'rgba(32,96,160,0.10)' },
              ].map(({ name, icon, color, bg }) => (
                <div key={name} style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(255,252,235,0.70)', border: '1px solid rgba(180,140,60,0.22)', borderRadius: 14, padding: '1rem 1.25rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                    <i className={icon} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1a4a08' }}>{name}</div>
                    <div style={{ fontSize: '0.77rem', fontWeight: 700, color: '#6a7a50' }}>BS Information Technology · Lorma Colleges</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Contact band ── */}
        <Reveal>
          <div style={{ background: 'linear-gradient(135deg,rgba(28,79,9,0.10),rgba(90,170,48,0.07))', border: '1px solid rgba(90,170,48,0.35)', borderRadius: 24, padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap', boxShadow: '0 6px 30px rgba(28,79,9,0.10)' }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', fontWeight: 900, color: '#1a4a08', marginBottom: '0.5rem' }}>Get in Touch</h2>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3a5020', lineHeight: 1.7, margin: 0 }}>
                Questions about adopting, rehoming, or how the platform works?<br />
                Reach us at <strong>pawster.medico@gmail.com</strong> or on Facebook.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href="https://mail.google.com/mail/?view=cm&to=pawster.medico@gmail.com"
target="_blank"
rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.75rem', borderRadius: 12, fontWeight: 900, fontSize: '0.9rem', color: '#fff', background: '#1c4f09', textDecoration: 'none', boxShadow: '0 4px 16px rgba(28,79,9,0.25)' }}>
                <i className="fas fa-envelope" /> Email Us
              </a>
              <Link to="/pets" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.75rem', borderRadius: 12, fontWeight: 800, fontSize: '0.9rem', color: '#3a5020', background: 'rgba(255,248,220,0.75)', border: '1px solid rgba(180,140,60,0.28)', textDecoration: 'none' }}>
                <i className="fas fa-search" /> Browse Pets
              </Link>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-[rgba(90,170,48,0.45)] bg-[rgba(255,248,218,0.85)] backdrop-blur-md px-10 py-12">
        <div className="max-w-[1200px] mx-auto grid gap-12 mb-10 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div>
            <div className="mb-2">
              <img src={logo} alt="Pawster" className="w-8 h-8 object-contain" onError={(e) => (e.target.style.display = "none")} />
            </div>
            <div className="font-black text-[1.2rem] text-[#1a4a08]">
              Paw<em className="italic text-[#e07820]">ster</em>
            </div>
            <p className="text-[0.82rem] font-bold leading-7 text-[#6a7a50] max-w-[260px] mt-2">
              A digital platform connecting adopters and rescue coordinators across Baguio City and the Cordillera Administrative Region.
            </p>
          </div>
          {[
            { title: "Adopt",    links: [["Browse Animals", "/pets"], ["My Profile", "/profile"], ["Log In", "/login"], ["Register", "/register"]] },
            { title: "Services", links: [["How It Works", "/how-it-works"], ["Rehome & Rescue", "/rehome"], ["Missing Pets", "/missing-pets"], ["About Us", "/about"]] },
            { title: "Provinces",  links: [["Baguio City", "/pets"], ["Benguet", "/pets"], ["Mountain Province", "/pets"], ["Ifugao", "/pets"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div className="text-[0.72rem] font-black uppercase tracking-wider text-[#1c4f09] mb-4">{title}</div>
              {links.map(([label, to]) => (
                <Link key={label} to={to} className="block text-[0.83rem] font-bold text-[#3a5020] mb-2 hover:underline">{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="max-w-[1200px] mx-auto pt-6 border-t border-[rgba(180,140,60,0.28)] flex flex-wrap items-center justify-between gap-4">
          <div className="text-[0.75rem] font-bold text-[#6a7a50]">© 2025 Pawster. All rights reserved. Made with 🐾 in Baguio City.</div>
          <div className="flex gap-2">
            {["fab fa-facebook-f", "fab fa-instagram", "fab fa-twitter"].map(icon => (
              <a key={icon} href="#" className="w-8 h-8 flex items-center justify-center rounded-md text-[0.8rem] text-[#6a7a50] bg-[rgba(255,250,232,0.7)] border border-[rgba(180,140,60,0.28)] hover:bg-black/5 transition">
                <i className={icon} />
              </a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`@media(max-width:768px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}