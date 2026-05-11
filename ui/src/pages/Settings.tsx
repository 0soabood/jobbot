import { useState, useEffect } from 'react';
import { Cpu, Palette, Database, Shield, Zap, RotateCcw, Download, Terminal, Coins, CreditCard } from 'lucide-react';
import { api } from '../lib/api/client';
import { AppSettings } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    void loadSettings();
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const saved = await api.saveSettings(settings);
    setSettings(saved);
    setTimeout(() => setSaving(false), 400);
  };

  const handleReset = () => {
    if (confirm('Clear all local data? This will reset your profile, applications, and settings.')) {
      void api.resetWorkspace().then(() => window.location.reload());
    }
  };

  const handleBuyCredits = async (priceId: string) => {
    setIsCheckingOut(priceId);
    try {
      const url = await api.createCheckoutSession(priceId);
      window.location.href = url;
    } catch (err: any) {
      alert(err.message || 'Failed to start checkout');
      setIsCheckingOut(null);
    }
  };

  if (loading || !settings) {
    return <div className="animate-pulse bg-graphite-900/10 h-screen" />;
  }

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl mb-2">System Config</h1>
        <p className="text-steel font-medium">Control the workspace API, UI preferences, and local persistence rules.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-signal-green/10 rounded-lg">
                <Cpu className="w-5 h-5 text-signal-green" />
              </div>
              <h2 className="text-xl">AI Provider Intelligence</h2>
            </div>

            <Card>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-steel uppercase tracking-widest">Provider</label>
                    <select
                      className="w-full h-10 bg-graphite-900 border border-graphite-700 rounded-lg px-3 text-sm"
                      value={settings.aiProvider}
                      onChange={(event) => updateSetting('aiProvider', event.target.value)}
                    >
                      <option value="OpenAI-compatible">OpenAI-compatible</option>
                      <option value="Workspace API">Workspace API</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-steel uppercase tracking-widest">Model</label>
                    <select
                      className="w-full h-10 bg-graphite-900 border border-graphite-700 rounded-lg px-3 text-sm"
                      value={settings.modelName}
                      onChange={(event) => updateSetting('modelName', event.target.value)}
                    >
                      <option value="gpt-5-mini">gpt-5-mini</option>
                      <option value="gpt-5.2">gpt-5.2</option>
                      <option value="mock-demo">mock-demo</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-steel uppercase tracking-widest">Base API URL</label>
                    <Input
                      value={settings.apiUrl}
                      onChange={(event) => updateSetting('apiUrl', event.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="p-4 bg-graphite-800 rounded-xl border border-graphite-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-steel" />
                    <div>
                      <p className="text-sm font-bold text-mercury uppercase">{settings.aiProvider}</p>
                      <p className="text-[10px] text-steel uppercase">Current model: {settings.modelName}</p>
                    </div>
                  </div>
                  <Badge variant="success">ACTIVE</Badge>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-burn-orange/10 rounded-lg">
                <Palette className="w-5 h-5 text-burn-orange" />
              </div>
              <h2 className="text-xl">Interface Preferences</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:border-signal-green/30 transition-all cursor-pointer bg-graphite-900 border-signal-green/20">
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="w-12 h-12 bg-graphite-800 rounded-2xl flex items-center justify-center border border-graphite-700">
                    <div className="w-6 h-6 bg-graphite-950 rounded-full border-4 border-signal-green" />
                  </div>
                  <div>
                    <p className="font-bold text-mercury uppercase text-sm">Obsidian Steel</p>
                    <p className="text-[10px] text-steel">Active system theme</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="opacity-50 cursor-not-allowed">
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="w-12 h-12 bg-mercury rounded-2xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-white rounded-full border-4 border-steel" />
                  </div>
                  <div>
                    <p className="font-bold text-steel uppercase text-sm">Clean Paper</p>
                    <p className="text-[10px] text-steel">Not implemented in this export</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-burn-orange/10 rounded-lg">
                  <Coins className="w-5 h-5 text-burn-orange" />
                </div>
                <h2 className="text-xl">Billing & Credits</h2>
              </div>

              <Card>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border border-graphite-700 bg-graphite-900 rounded-xl space-y-4">
                      <h3 className="font-bold text-mercury text-lg">Starter Pack</h3>
                      <p className="text-2xl font-display font-bold text-signal-green">€10</p>
                      <p className="text-xs text-steel">25 Application Credits</p>
                      <Button 
                        className="w-full gap-2" 
                        disabled={isCheckingOut !== null} 
                        onClick={() => handleBuyCredits('price_10')}
                      >
                        {isCheckingOut === 'price_10' ? 'Loading...' : <><CreditCard className="w-4 h-4" /> Buy 25 Credits</>}
                      </Button>
                    </div>
                    <div className="p-6 border border-signal-green/30 bg-graphite-800 rounded-xl space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-signal-green text-graphite-950 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">Best Value</div>
                      <h3 className="font-bold text-mercury text-lg">Pro Pack</h3>
                      <p className="text-2xl font-display font-bold text-signal-green">€25</p>
                      <p className="text-xs text-steel">75 Application Credits</p>
                      <Button 
                        className="w-full gap-2 bg-signal-green text-graphite-950 hover:bg-signal-green/90" 
                        disabled={isCheckingOut !== null} 
                        onClick={() => handleBuyCredits('price_25')}
                      >
                        {isCheckingOut === 'price_25' ? 'Loading...' : <><CreditCard className="w-4 h-4" /> Buy 75 Credits</>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
        </div>

        <aside className="space-y-6">
          <h2 className="text-xl">Safety Protocols</h2>
          <Card className="bg-graphite-900 border-graphite-700">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-steel">
                  <Database className="w-4 h-4" />
                  <span className="text-xs uppercase font-bold tracking-widest">Local Persistence</span>
                </div>
                <div className="p-4 bg-graphite-800/50 rounded-xl space-y-4 text-xs leading-relaxed text-steel">
                  <p>Applications, profile data, and settings are stored in the shared jobbot workspace.</p>
                  <p>Demo mode: <span className="text-mercury">{settings.demoMode ? 'enabled' : 'disabled'}</span></p>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full gap-2 text-xs h-12" onClick={handleSave} disabled={saving}>
                  <Zap className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button variant="outline" className="w-full gap-2 text-xs h-12">
                  <Download className="w-4 h-4" /> Export State Bundle
                </Button>
                <Button variant="danger" className="w-full gap-2 text-xs h-12" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" /> Final Reset (Clear All)
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 glass-panel rounded-2xl border-dashed flex flex-col items-center justify-center text-center gap-4">
            <Shield className="w-8 h-8 text-signal-green opacity-40 shrink-0" />
            <div>
              <p className="text-sm font-bold text-mercury uppercase">Zero-Knowledge Mode</p>
              <p className="text-[10px] text-steel mt-1 uppercase leading-relaxed">
                No data leaves the workspace when demo mode is enabled. The UI now reads and writes the real CLI files through the local API.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
