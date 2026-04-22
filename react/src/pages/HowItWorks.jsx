import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from "../images/logo.png";

function useReveal() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.12 });
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

// Adopter-side steps based on the platform's actual flow
const ADOPTER_STEPS = [
  { num: '01', icon: 'fas fa-user-plus',       color: '#1c4f09', bg: 'rgba(28,79,9,0.12)',     title: 'Register & Upload ID',        desc: 'Create your Pawster account and upload a valid government-issued ID. Verified profiles help rescue organizations trust your application.' },
  { num: '02', icon: 'fas fa-clipboard-list',  color: '#2060a0', bg: 'rgba(32,96,160,0.11)',   title: 'Complete the Questionnaire',  desc: 'Answer questions about your living situation, previous pet experience, time availability, and financial readiness before submitting any request.' },
  { num: '03', icon: 'fas fa-search',          color: '#B45A22', bg: 'rgba(180,90,34,0.12)',   title: 'Browse & Choose an Animal',   desc: 'Explore animals available across the four Ilocos provinces. Use the map to find rescue organizations near you and choose the right match.' },
  { num: '04', icon: 'fas fa-file-circle-check', color: '#d4880a', bg: 'rgba(212,136,10,0.12)', title: 'Submit Adoption Request',    desc: 'Send a formal adoption request for your chosen animal. Your application will be marked Pending while the rescue coordinator reviews it.' },
  { num: '05', icon: 'fas fa-hourglass-half',  color: '#7040b0', bg: 'rgba(112,64,176,0.11)',  title: 'Await Review & Decision',     desc: 'The rescue organization reviews your profile and questionnaire. They may approve, reject, or follow up with questions directly through the platform.' },
  { num: '06', icon: 'fas fa-heart',           color: '#c03060', bg: 'rgba(192,48,96,0.11)',   title: 'Adopt & Stay Connected',      desc: 'Once approved, complete the adoption. Post-adoption check-ins are scheduled at Day 7, Day 30, and Day 90 — with in-app messaging available throughout.' },
];

const CHECKINS = [
  { day: 'Day 7',  icon: 'fas fa-stethoscope', title: 'Early Adjustment',   desc: 'Report how your pet is settling in, confirm your first vet visit, and share an optional photo update.' },
  { day: 'Day 30', icon: 'fas fa-comments',    title: 'One-Month Check-In', desc: 'Share behavioral progress, flag any concerns early, and stay in direct contact with your rescue coordinator.' },
  { day: 'Day 90', icon: 'fas fa-heart',       title: 'Three-Month Review', desc: 'Confirm long-term welfare and complete an adopter feedback record that helps guide future adoptions.' },
];

const FAQS = [
  { q: 'Do I need to complete the questionnaire before browsing animals?',  a: 'You can browse animals freely, but you must complete the pre-adoption questionnaire before submitting any adoption request.' },
  { q: 'How long does the review process take?',                            a: 'Review times vary by organization, but most applications receive a response within a few business days. You can track your status on the platform.' },
  { q: 'What happens if my application is rejected?',                       a: 'The rescue coordinator may provide feedback. You are welcome to apply for a different animal that may be a better fit for your situation.' },
  { q: 'Can I rehome a pet I can no longer care for?',                      a: 'Yes. Use the Rehome a Pet feature to submit a rehoming request to a rescue organization. The organization reviews and coordinates from there.' },
  { q: 'What are the post-adoption check-ins?',                             a: 'After adoption, you\'ll receive notifications at Day 7, 30, and 90 to submit a short update on your pet\'s condition. This opens an in-app messaging channel with your rescue coordinator.' },
  { q: 'Is the platform available outside the Ilocos Region?',             a: 'Pawster currently serves Ilocos Norte, Ilocos Sur, La Union, and Pangasinan. Inter-region cases may be handled individually by the rescue organization.' },
];

export default function HowItWorks() {
  const { user, logout } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: '#EDDABB', fontFamily: "'Nunito',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:wght@400;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes fl1{0%,100%{transform:translate(0,0)}50%{transform:translate(5%,8%)}}
        @keyframes fl2{0%,100%{transform:translate(0,0)}50%{transform:translate(-8%,5%)}}
        *,*::before,*::after{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#eddabb}::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}
      `}</style>

      {/* Mesh bg */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#EDDABB' }} />
        <div style={{ position: 'absolute', width: 900, height: 900, top: '-20%', left: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#588B41,transparent 70%)', filter: 'blur(120px)', opacity: 0.45, animation: 'fl1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 800, height: 800, top: '10%', right: '-18%', borderRadius: '50%', background: 'radial-gradient(circle,#B45A22,transparent 70%)', filter: 'blur(120px)', opacity: 0.40, animation: 'fl2 11s ease-in-out infinite' }} />
      </div>

      

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1100, margin: '0 auto', padding: '4rem 2.5rem 6rem' }}>

        {/* ── Header ── */}
        <Reveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
            <i className="fas fa-list-ol" style={{ fontSize: '0.65rem' }} /> The Process
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2.2rem,4vw,3.4rem)', fontWeight: 900, color: '#1a4a08', lineHeight: 1.1, marginBottom: '1rem' }}>
            How <em style={{ fontStyle: 'italic', color: '#e07820' }}>Adoption</em> Works
          </h1>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#3a5020', maxWidth: 560, lineHeight: 1.7, marginBottom: '3.5rem' }}>
            Pawster guides you through every step — from creating your profile to your 90-day post-adoption check-in. Here's exactly what to expect.
          </p>
        </Reveal>

        {/* ── Adopter Steps ── */}
        <Reveal delay={40}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1.25rem', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
            <i className="fas fa-user" style={{ fontSize: '0.65rem' }} /> For Adopters
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem', marginBottom: '5rem' }}>
          {ADOPTER_STEPS.map(({ num, icon, color, bg, title, desc }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div style={{ position: 'relative', background: 'rgba(255,248,225,0.80)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 24px rgba(100,70,20,0.11)', transition: 'transform 0.2s', cursor: 'default', height: '100%' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ position: 'absolute', top: '1rem', right: '1.25rem', fontFamily: "'Playfair Display',serif", fontSize: '3.2rem', fontWeight: 900, color: 'rgba(28,79,9,0.08)', lineHeight: 1 }}>{num}</div>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '1.2rem' }}>
                  <i className={icon} />
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#1a4a08', marginBottom: '0.5rem' }}>{title}</div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6a7a50', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ── Post-Adoption Check-Ins ── */}
        <Reveal delay={80}>
          <div style={{ background: 'linear-gradient(135deg,rgba(28,79,9,0.10),rgba(90,170,48,0.07))', border: '1px solid rgba(90,170,48,0.35)', borderRadius: 24, padding: '2.75rem', marginBottom: '5rem', boxShadow: '0 6px 30px rgba(28,79,9,0.10)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(28,79,9,0.10)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
              <i className="fas fa-calendar-check" style={{ fontSize: '0.65rem' }} /> Post-Adoption
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', fontWeight: 900, color: '#1a4a08', marginBottom: '0.75rem' }}>Scheduled Check-Ins After Adoption</h2>
            <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#3a5020', lineHeight: 1.8, marginBottom: '2rem', maxWidth: 580 }}>
              Once the adoption is complete, Pawster automatically schedules three check-ins. Each one opens a private messaging channel between you and your rescue coordinator.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {CHECKINS.map(({ day, icon, title, desc }) => (
                <div key={day} style={{ flex: '1 1 200px', background: 'rgba(255,250,232,0.75)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 16, padding: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(28,79,9,0.10)', color: '#1c4f09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                    <i className={icon} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#d4880a', marginBottom: '0.1rem' }}>{day}</div>
                    <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1a4a08', marginBottom: '0.25rem' }}>{title}</div>
                    <p style={{ fontSize: '0.81rem', fontWeight: 700, color: '#6a7a50', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Requirements ── */}
        <Reveal>
          <div style={{ background: 'rgba(255,248,225,0.80)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 24, padding: '2.5rem', marginBottom: '3rem', boxShadow: '0 4px 24px rgba(100,70,20,0.11)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
              <i className="fas fa-clipboard-list" style={{ fontSize: '0.65rem' }} /> Requirements
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', fontWeight: 900, color: '#1a4a08', marginBottom: '1.5rem' }}>What You'll Need</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem' }}>
              {[
                { icon: 'fas fa-id-card',              label: 'Valid Government-Issued ID' },
                { icon: 'fas fa-home',                 label: 'Pet-Friendly Living Space' },
                { icon: 'fas fa-phone',                label: 'Active Contact Number' },
                { icon: 'fas fa-users',                label: 'Household Agreement' },
                { icon: 'fas fa-wallet',               label: 'Financial Readiness for Pet Care' },
                { icon: 'fas fa-hand-holding-heart',   label: 'Genuine Long-Term Commitment' },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,252,238,0.6)', borderRadius: 12, padding: '0.9rem 1rem', border: '1px solid rgba(200,170,100,0.3)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(28,79,9,0.10)', color: '#1c4f09', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={icon} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1a4a08' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── FAQ ── */}
        <Reveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
            <i className="fas fa-question-circle" style={{ fontSize: '0.65rem' }} /> FAQ
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', fontWeight: 900, color: '#1a4a08', marginBottom: '1.5rem' }}>Common Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {FAQS.map(({ q, a }, i) => (
              <div key={i} style={{ background: 'rgba(255,248,225,0.80)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(100,70,20,0.08)' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#1a4a08', textAlign: 'left' }}>
                  {q}
                  <i className={'fas fa-chevron-' + (openFaq === i ? 'up' : 'down')} style={{ color: '#6a7a50', fontSize: '0.8rem', flexShrink: 0, marginLeft: '1rem' }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 1.5rem 1.2rem', fontSize: '0.88rem', fontWeight: 700, color: '#3a5020', lineHeight: 1.7 }}>{a}</div>
                )}
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── CTA ── */}
        <Reveal delay={100}>
          <div style={{ marginTop: '4rem', textAlign: 'center' }}>
            <Link to="/pets" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.5rem', borderRadius: 13, fontWeight: 900, fontSize: '1rem', color: '#fff', background: '#1c4f09', textDecoration: 'none', boxShadow: '0 6px 24px rgba(28,79,9,0.30)' }}>
              <i className="fas fa-search" /> Browse Animals
            </Link>
          </div>
        </Reveal>
      </div>

       {/* Footer */}
            <footer className="relative z-10 border-t border-[rgba(90,170,48,0.45)] bg-[rgba(255,248,218,0.85)] backdrop-blur-md px-10 py-12">
              <div className="max-w-[1200px] mx-auto grid gap-12 mb-10 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
                <div>
                  <div className="mb-2">
                    <img src={logo} alt="Pawster" className="w-8 h-8 object-contain" onError={(e) => (e.target.style.display = "none")} />
                  </div>
                  <div className="font-black text-[1.2rem] text-[#1a4a08]">Paw<em className="italic text-[#e07820]">ster</em></div>
                  <p className="text-[0.82rem] font-bold leading-7 text-[#6a7a50] max-w-[260px] mt-2">
                    Screening, placing, and supporting animal adoptions across Baguio City and the Cordillera Administrative Region with care and accountability.
                  </p>
                </div>
                {[
                  { title: "Adopt", links: [["Browse animals", "/pets"], ["My profile", "/profile"], ["Log in", "/login"], ["Register", "/register"]] },
                  { title: "Services", links: [["How it works", "/how-it-works"], ["Rehome & Rescue", "/rehome"], ["Missing pets", "/missing-pets"], ["About us", "/about"]] },
                  { title: "Regions", links: [["Baguio City", "/pets"], ["Benguet", "/pets"], ["Mountain Province", "/pets"], ["Ifugao", "/pets"]] },
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
    </div>
  );
}