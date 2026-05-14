import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { api } from '../lib/api/client';

const STEPS = [
  { id: 'profile', title: 'Identity', desc: 'Personal details' },
  { id: 'roles', title: 'Targeting', desc: 'Dream roles' },
  { id: 'resume', title: 'Fuel', desc: 'Your experience' },
  { id: 'preferences', title: 'Constraints', desc: 'Work style' },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    targetRoles: '',
    resumeText: '',
    remote: 'hybrid',
    locations: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((step) => step + 1);
      return;
    }

    void handleComplete();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  const handleComplete = async () => {
    if (!formData.fullName.trim() || !formData.targetRoles.trim()) {
      alert("Please provide your full name and at least one target role to continue.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const profile = {
        fullName: formData.fullName,
        email: formData.email,
        targetRoles: formData.targetRoles.split(',').map((role) => role.trim()).filter(Boolean),
        skills: ['Operations', 'Automation', 'Data Analysis'],
        bio: '',
        links: {},
        preferences: {
          remote: formData.remote as 'remote' | 'hybrid' | 'onsite',
          locations: formData.locations.split(',').map((location) => location.trim()).filter(Boolean),
        },
        resumeText: formData.resumeText,
      };

      await api.saveProfile(profile);
      navigate('/dashboard');
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-graphite-950 grid-bg selection:bg-signal-green selection:text-graphite-950 flex flex-col items-center justify-center p-6">
      <div className="absolute top-10 left-10 flex items-center gap-2">
        <div className="w-8 h-8 bg-signal-green rounded flex items-center justify-center glow-green">
          <Zap className="w-5 h-5 text-graphite-950 fill-current" />
        </div>
        <span className="font-display font-bold text-2xl tracking-tighter">jobbot.</span>
      </div>

      <div className="max-w-2xl w-full space-y-10">
        <div className="flex justify-between relative px-2">
          <div className="absolute top-1/2 left-0 w-full h-px bg-graphite-800 -translate-y-1/2 z-0" />
          {STEPS.map((step, index) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold border-2 transition-all duration-300 ${
                  index <= currentStep
                    ? 'bg-signal-green border-signal-green text-graphite-950 glow-green'
                    : 'bg-graphite-900 border-graphite-800 text-steel'
                }`}
              >
                {index < currentStep ? <CheckCircle2 className="w-6 h-6" /> : index + 1}
              </div>
              <div className="text-center hidden sm:block">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${index <= currentStep ? 'text-mercury' : 'text-steel'}`}>
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Card className="p-8 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl">WHO ARE YOU?</h2>
                    <p className="text-steel">Basic comms to build your command profile.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-steel uppercase tracking-widest">Full Name</label>
                      <Input
                        placeholder="Alex Rivera"
                        value={formData.fullName}
                        onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-steel uppercase tracking-widest">Email Address</label>
                      <Input
                        type="email"
                        placeholder="alex@ops.dev"
                        value={formData.email}
                        onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl">TARGET PARAMETERS</h2>
                    <p className="text-steel">What roles are worth targeting? Separate entries with commas.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-steel uppercase tracking-widest">Roles You Want</label>
                    <Textarea
                      placeholder="Product Operations, Program Manager, Analyst..."
                      className="min-h-[100px]"
                      value={formData.targetRoles}
                      onChange={(event) => setFormData({ ...formData, targetRoles: event.target.value })}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl">INGEST EXPERIENCE</h2>
                    <p className="text-steel">Paste your current resume. The workspace API will use it to seed generated packets.</p>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-signal-green/5 border-2 border-dashed border-graphite-700 group-hover:border-signal-green/50 transition-colors rounded-2xl pointer-events-none" />
                    <Textarea
                      placeholder="PASTE RESUME CONTENT HERE..."
                      className="min-h-[300px] relative z-10 bg-transparent border-0 focus-visible:ring-0"
                      value={formData.resumeText}
                      onChange={(event) => setFormData({ ...formData, resumeText: event.target.value })}
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl">FINAL CONSTRAINTS</h2>
                    <p className="text-steel">How and where do you want to work?</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-steel uppercase tracking-widest">Work Style</label>
                      <select
                        className="w-full h-10 bg-graphite-900 border border-graphite-700 rounded-lg px-3 text-sm"
                        value={formData.remote}
                        onChange={(event) => setFormData({ ...formData, remote: event.target.value })}
                      >
                        <option value="remote">Remote Only</option>
                        <option value="hybrid">Hybrid / Flexible</option>
                        <option value="onsite">On-site Only</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-steel uppercase tracking-widest">Locations</label>
                      <Input
                        placeholder="Austin, NYC, Remote"
                        value={formData.locations}
                        onChange={(event) => setFormData({ ...formData, locations: event.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-12 pt-8 border-t border-graphite-800 flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={handleNext} disabled={saving} className="gap-2 px-8">
              {saving ? 'Saving...' : currentStep === STEPS.length - 1 ? 'Finish Profile' : 'Continue'} <ArrowRight className="w-4 h-4" />
            </Button>
          </footer>
          {saveError && <p className="mt-4 text-sm text-burn-orange">{saveError}</p>}
        </Card>

        <p className="text-center text-[10px] font-mono text-steel uppercase tracking-[0.2em] animate-pulse">
          ENCRYPTED END-TO-END | AI AGENT WARMING UP
        </p>
      </div>
    </div>
  );
}
