import { useState, useEffect } from 'react';
import { 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Layers,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../lib/api/client';
import { ApplicationPacket } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Applications() {
  const [packets, setPackets] = useState<ApplicationPacket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPackets = async () => {
      try {
        const data = await api.getPackets();
        setPackets(data);
      } catch (error) {
        console.error('Failed to load applications:', error);
      } finally {
        setLoading(false);
      }
    };
    void loadPackets();
  }, []);

  const grouped = {
    draft: packets.filter(p => p.status === 'draft'),
    reviewing: packets.filter(p => p.status === 'reviewing'),
    submitted: packets.filter(p => p.status === 'submitted'),
  };

  if (loading) return <div className="animate-pulse h-screen bg-graphite-900/10" />;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-graphite-800 rounded border border-graphite-700 mb-2">
            <Layers className="w-3 h-3 text-steel" />
            <span className="text-[10px] font-mono font-bold text-steel">PIPELINE MONITOR</span>
          </div>
          <h1 className="text-4xl">Applications</h1>
          <p className="text-steel font-medium">Manage your tailored packets and submission status.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(['draft', 'reviewing', 'submitted'] as const).map((status) => (
          <div key={status} className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                 <span className={cn(
                   "w-2 h-2 rounded-full",
                   status === 'draft' ? "bg-steel" : status === 'reviewing' ? "bg-burn-orange animate-pulse" : "bg-signal-green"
                 )} />
                 {status} <span className="text-steel font-normal ml-1">({grouped[status].length})</span>
              </h2>
            </div>

            <div className="space-y-4">
              {grouped[status].map((packet) => (
                <Card key={packet.id} className="group hover:border-graphite-600 transition-all">
                  <Link to={`/applications/${packet.id}`}>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-mercury group-hover:text-signal-green transition-colors leading-tight">
                            {packet.jobTitle}
                          </h3>
                          <p className="text-xs text-steel mt-1 font-medium">{packet.companyName}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-steel group-hover:text-signal-green transition-colors" />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-graphite-800">
                        <div className="flex items-center gap-2 text-[10px] text-steel">
                          <Clock className="w-3 h-3" />
                          <span>Edited {new Date(packet.lastEditedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[10px] font-bold text-signal-green">
                          {packet.checklist.filter(c => c.completed).length} / {packet.checklist.length} TASKS
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
              {grouped[status].length === 0 && (
                <div className="h-24 border-2 border-dashed border-graphite-800 rounded-2xl flex items-center justify-center text-[10px] uppercase font-mono text-steel tracking-widest">
                  EMPTY NODE
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
