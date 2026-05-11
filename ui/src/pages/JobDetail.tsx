import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, ExternalLink, Zap, Globe, Building, Target, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api/client';
import { JobListing } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const loadJob = async () => {
        try {
          const data = await api.getJob(id);
          if (data) {
            setJob(data);
          }
        } catch (error) {
          console.error('Failed to load job:', error);
        } finally {
          setLoading(false);
        }
      };
      void loadJob();
    }
  }, [id]);

  const handleGeneratePacket = async () => {
    if (!job) return;
    try {
      const packet = await api.generatePacket(job.id);
      navigate(`/applications/${packet.id}`);
    } catch (error: any) {
      alert(error.message || "Failed to generate packet. Please check your credits.");
    }
  };

  if (loading || !job) {
    return <div className="animate-pulse bg-graphite-900/10 h-screen" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="space-y-6">
        <button onClick={() => navigate(-1)} className="text-steel hover:text-mercury flex items-center gap-2 text-sm transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Intelligence
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-graphite-800 rounded-2xl flex items-center justify-center border border-graphite-700">
                <Building className="w-6 h-6 text-steel" />
              </div>
              <div>
                <h2 className="text-xl font-display font-medium text-mercury uppercase tracking-widest">{job.company}</h2>
                <div className="flex items-center gap-2 text-steel text-xs font-mono uppercase tracking-widest mt-1">
                  <MapPin className="w-3 h-3" /> {job.location} - <Globe className="w-3 h-3" /> {job.source}
                </div>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl tracking-tight leading-none">{job.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-6xl font-display font-black text-signal-green leading-none">{job.score.overall}%</div>
            <div className="text-[10px] font-mono font-bold text-steel mt-2 tracking-[0.2em] uppercase">SYSTEM ANALYSIS MATCH</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-display uppercase tracking-tight">Intelligence Brief</h2>
            <div className="prose prose-invert max-w-none text-steel leading-relaxed">
              <p className="text-lg text-mercury italic-display lowercase mb-4">
                "High signal match for cross-functional operations work with a systems and automation bias."
              </p>
              <p>{job.description}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-graphite-800">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-steel uppercase tracking-widest">Key Missions</h3>
              <ul className="space-y-3">
                {['Establish internal PMO structures', 'Own workflow automation lifecycle', 'Drive stakeholder alignment'].map((item) => (
                  <li key={item} className="text-sm text-mercury flex items-start gap-2">
                    <span className="text-signal-green mt-1">{'>'}</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-steel uppercase tracking-widest">Required Gear</h3>
              <ul className="space-y-3">
                {['5+ years in Product Ops', 'Expert at Linear, Jira, or Notion', 'Comfortable automating operational work'].map((item) => (
                  <li key={item} className="text-sm text-mercury flex items-start gap-2">
                    <span className="text-signal-green mt-1">{'>'}</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="pt-8 border-t border-graphite-800 space-y-6">
            <h2 className="text-2xl">The Signal Breakdown</h2>
            <div className="space-y-4">
              {['Skills Overlap', 'Experience Depth', 'Role Alignment'].map((category, index) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-steel uppercase tracking-widest">{category}</span>
                    <span className="text-signal-green">{90 - index * 8}%</span>
                  </div>
                  <div className="h-1 bg-graphite-800 rounded-full overflow-hidden">
                    <div className="h-full bg-signal-green" style={{ width: `${90 - index * 8}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="bg-graphite-900 border-signal-green/20 sticky top-24">
            <CardHeader className="pb-3 border-b border-graphite-800">
              <CardTitle className="text-xs text-steel flex items-center gap-2">
                <Target className="w-3 h-3" /> ACTION PROTOCOL
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-xs text-steel uppercase tracking-widest font-bold">Recommended Logic</p>
                <p className="text-sm text-mercury leading-relaxed">
                  The generated packet should emphasize the strongest overlap from the match reasons and close the keyword gaps without inventing experience.
                </p>
              </div>

              <Button onClick={handleGeneratePacket} className="w-full h-14 text-base gap-3">
                <Zap className="w-5 h-5 fill-current" /> GENERATE PACKET
              </Button>

              <Button variant="outline" className="w-full gap-2" onClick={() => window.open(job.url, '_blank')}>
                Open Listing <ExternalLink className="w-4 h-4" />
              </Button>

              <div className="pt-4 border-t border-graphite-800 flex items-center justify-between">
                <span className="text-[10px] text-steel font-mono">AI CONFIDENCE</span>
                <span className="text-signal-green font-mono font-bold">98.2%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-graphite-900/50">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-steel" />
                <h4 className="text-[10px] font-bold text-steel uppercase tracking-widest">ATS SHIELD ACTIVE</h4>
              </div>
              <p className="text-xs text-steel leading-relaxed">
                Jobbot has already identified the missing keywords for this posting so the packet can be tuned before you apply manually.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
