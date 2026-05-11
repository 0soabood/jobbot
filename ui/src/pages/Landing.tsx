import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Target, Rocket, ArrowRight, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../components/AuthProvider';
import { api } from '../lib/api/client';

export default function Landing() {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      api.getProfile()
        .then(profile => {
          if (profile && profile.fullName && profile.targetRoles && profile.targetRoles.length > 0) {
            navigate('/dashboard');
          } else {
            navigate('/onboarding');
          }
        })
        .catch(() => navigate('/onboarding'));
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-graphite-950 text-mercury selection:bg-signal-green selection:text-graphite-950">
      <nav className="fixed top-0 w-full h-20 border-b border-graphite-800/50 bg-graphite-950/80 backdrop-blur-md z-50 flex items-center justify-between px-8 md:px-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-signal-green rounded flex items-center justify-center glow-green">
            <Zap className="w-5 h-5 text-graphite-950 fill-current" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tighter">
            jobbot<span className="text-signal-green">.</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-steel">
          <a href="#workflow" className="hover:text-mercury transition-colors">How it Works</a>
          <a href="#features" className="hover:text-mercury transition-colors">Features</a>
          <a href="#proof" className="hover:text-mercury transition-colors">Proof</a>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={loginWithGoogle}>Login</Button>
          <Button size="sm" onClick={loginWithGoogle}>Get Started</Button>
        </div>
      </nav>

      <section className="relative pt-40 pb-20 px-8 flex flex-col items-center overflow-hidden grid-bg">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full h-96 bg-signal-green/5 blur-[120px] rounded-full" />
        <div className="absolute -top-32 right-[-8rem] h-80 w-80 rounded-full bg-burn-orange/10 blur-[130px]" />
        <div className="absolute bottom-[-8rem] left-[-6rem] h-72 w-72 rounded-full bg-signal-green/8 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center max-w-4xl z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-graphite-800 rounded-full border border-graphite-700 mb-8 shadow-[0_0_0_1px_rgba(0,255,65,0.04)]">
            <span className="w-2 h-2 rounded-full bg-signal-green animate-pulse" />
            <span className="text-xs font-mono font-medium text-steel">UI PACKAGE READY | REAL WORKSPACE API ACTIVE</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-display font-black tracking-tight leading-[0.9] mb-8">
            THE CHEAT CODE FOR <br />
            <span className="text-signal-green px-4 border-2 border-signal-green rounded-2xl rotate-[-2deg] inline-block shadow-[0_0_40px_rgba(0,255,65,0.2)]">
              JOB SEEKERS
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-steel font-medium max-w-2xl mx-auto mb-12">
            Tired of being screened by AI? Start applying with AI. Search faster, tailor better, and keep the final send step under your control.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/onboarding">
              <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg rounded-2xl">
                START APPLYING FASTER
              </Button>
            </Link>
            <Link to="/jobs">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-10 text-lg rounded-2xl">
                VIEW DEMO DASHBOARD
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            {[
              { label: 'Live job ranking', value: 'Signal-first shortlist' },
              { label: 'Tailored packets', value: 'Cover letter + resume notes' },
              { label: 'Manual final send', value: 'You stay in control' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-graphite-800 bg-graphite-900/80 p-4 shadow-2xl">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-steel mb-2">{item.label}</p>
                <p className="text-sm font-medium text-mercury">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-24 relative w-full max-w-6xl"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-signal-green/20 via-transparent to-burn-orange/20 blur-xl opacity-50" />
          <div className="relative rounded-2xl border border-graphite-700 bg-graphite-900 shadow-2xl p-4 aspect-[16/9] overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 rounded-full bg-red-500/50" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
              <div className="h-3 w-3 rounded-full bg-green-500/50" />
            </div>
            <div className="grid grid-cols-12 gap-4 h-full">
              <div className="col-span-3 space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-10 bg-graphite-800 rounded-lg animate-pulse" />
                ))}
              </div>
              <div className="col-span-9 space-y-4">
                <div className="h-40 bg-graphite-800 rounded-xl animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-60 bg-graphite-800 rounded-xl animate-pulse" />
                  <div className="h-60 bg-graphite-800 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="workflow" className="py-32 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 italic italic-display">
            HOW YOU BEAT THE MACHINE
          </h2>
          <p className="text-xl text-steel">A four-step workflow designed to remove repetitive application work.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-graphite-800 hidden md:block" />

          {[
            { icon: Search, title: 'FIND JOBS', desc: 'Pull together high-signal listings from one workspace.' },
            { icon: Target, title: 'SCORE MATCHES', desc: 'See where your profile overlaps and where the gaps are.' },
            { icon: Zap, title: 'TAILOR PACKETS', desc: 'Generate resume notes, cover letters, and answers quickly.' },
            { icon: Rocket, title: 'SEND FASTER', desc: 'Review the packet and submit manually on the employer portal.' },
          ].map((item) => (
            <div key={item.title} className="relative z-10 p-8 glass-panel rounded-2xl text-center group hover:border-signal-green/50 transition-all">
              <div className="w-16 h-16 bg-graphite-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <item.icon className="w-8 h-8 text-signal-green" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-steel text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="proof" className="py-40 bg-graphite-900 border-y border-graphite-800">
        <div className="max-w-4xl mx-auto px-8 text-center italic-display">
          <p className="text-3xl md:text-5xl font-display font-medium leading-tight mb-12">
            "The value is simple: I stopped rewriting the same application materials every night."
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-signal-green to-burn-orange shadow-[0_0_30px_rgba(0,255,65,0.25)]" />
            <div className="text-left">
              <p className="font-bold text-mercury font-display">MARCUS CHEN</p>
              <p className="text-xs text-steel">Senior Operations Manager</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 px-8 text-center">
        <h2 className="text-4xl font-display font-bold mb-8 italic italic-display">READY TO START APPLYING WITH AN EDGE?</h2>
        <Link to="/onboarding">
          <Button size="lg" className="h-16 px-12 text-lg rounded-2xl mb-20">JOIN THE JOBBOT PRIVATE BETA</Button>
        </Link>

        <div className="pt-20 border-t border-graphite-800 flex flex-col md:flex-row items-center justify-between gap-8 text-steel text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-signal-green" />
            <span className="font-display font-bold text-mercury">jobbot.</span>
            <span>(c) 2026. THE MACHINE IS BROKEN.</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-mercury">Privacy</a>
            <a href="#" className="hover:text-mercury">Terms</a>
            <a href="#" className="hover:text-mercury">Twitter</a>
            <a href="#" className="hover:text-mercury">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
