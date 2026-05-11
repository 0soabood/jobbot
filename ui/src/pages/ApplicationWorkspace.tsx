import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, Check, Save, FileText, MessageSquare, CheckSquare, Info, Zap } from 'lucide-react';
import { api } from '../lib/api/client';
import { ApplicationPacket } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Textarea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

export default function ApplicationWorkspace() {
  const { id } = useParams();
  const [packet, setPacket] = useState<ApplicationPacket | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'letter' | 'answers' | 'checklist'>('overview');
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);

  useEffect(() => {
    if (id) {
      const loadPacket = async () => {
        try {
          const data = await api.getPacket(id);
          if (data) {
            setPacket(data);
          }
        } catch (error) {
          console.error('Failed to load application:', error);
        } finally {
          setLoading(false);
        }
      };
      void loadPacket();
    }
  }, [id]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleChecklist = async (itemId: string) => {
    if (!packet) return;
    const checklist = packet.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    );
    const updated = await api.updateApplication(packet.id, { checklist });
    setPacket(updated);
  };

  const handleSave = async () => {
    if (!packet) return;
    setSaving(true);
    await api.updateApplication(packet.id, packet);
    setTimeout(() => setSaving(false), 500);
  };

  const handleMarkReady = async () => {
    if (!packet) return;
    setMarkingReady(true);
    const updated = await api.updateApplication(packet.id, { status: 'reviewing' });
    setPacket(updated);
    setTimeout(() => setMarkingReady(false), 400);
  };

  if (loading || !packet) {
    return <div className="animate-pulse bg-graphite-900/10 h-screen" />;
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Info },
    { id: 'resume', name: 'Resume Notes', icon: FileText },
    { id: 'letter', name: 'Cover Letter', icon: MessageSquare },
    { id: 'answers', name: 'Answers', icon: MessageSquare },
    { id: 'checklist', name: 'Checklist', icon: CheckSquare },
  ];

  const completion = Math.round((packet.checklist.filter((item) => item.completed).length / packet.checklist.length) * 100);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4">
          <Link to="/applications" className="text-steel hover:text-mercury inline-flex items-center gap-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Pipeline
          </Link>
          <div>
            <h1 className="text-4xl leading-none">{packet.jobTitle}</h1>
            <p className="text-xl text-steel mt-2">{packet.companyName} - Application Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <><Zap className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Local</>}
          </Button>
          <Button className="gap-2" onClick={handleMarkReady} disabled={markingReady}>
            {markingReady ? 'Updating...' : 'Ready to Submit'} <Check className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex border-b border-graphite-800 bg-graphite-950/80 backdrop-blur sticky top-16 z-20 -mx-10 px-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all',
              activeTab === tab.id
                ? 'border-signal-green text-signal-green'
                : 'border-transparent text-steel hover:text-mercury hover:bg-graphite-800/50',
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <Card className="p-8">
                <h3 className="text-xl mb-4 font-display">Intelligence Summary</h3>
                <p className="text-steel leading-relaxed mb-6">
                  This packet is built around the highest-signal role overlap. Review every claim before submission and keep edits truthful.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-graphite-800 rounded-xl border border-graphite-700">
                    <p className="text-[10px] text-steel font-bold uppercase mb-2">High Signal Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {['Workflow', 'Automation', 'Stakeholders', 'Execution'].map((keyword) => (
                        <Badge key={keyword} variant="default" className="bg-signal-green/10 text-signal-green border-signal-green/20">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-graphite-800 rounded-xl border border-graphite-700">
                    <p className="text-[10px] text-steel font-bold uppercase mb-2">ATS Critical Gap</p>
                    <div className="flex flex-wrap gap-2">
                      {['SQL Expertise'].map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-burn-orange border-burn-orange/30 leading-none">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex items-center gap-4">
                <Button variant="outline" className="w-full h-14 text-sm gap-2" onClick={() => window.open(packet.sourceUrl, '_blank')}>
                  Open Original Listing <ExternalLink className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full h-14 text-sm gap-2">
                  Company Insights <Info className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'resume' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl">Tailored Resume Insights</h3>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(packet.content.tailoredResumeNotes, 'resume')}>
                  {copied === 'resume' ? 'Copied!' : <><Copy className="w-4 h-4 mr-2" /> Copy Notes</>}
                </Button>
              </div>
              <Card className="p-1">
                <Textarea
                  className="min-h-[500px] bg-transparent border-0 font-mono text-sm leading-relaxed p-6 focus-visible:ring-0"
                  value={packet.content.tailoredResumeNotes}
                  onChange={(event) =>
                    setPacket({
                      ...packet,
                      content: { ...packet.content, tailoredResumeNotes: event.target.value },
                    })
                  }
                />
              </Card>
            </div>
          )}

          {activeTab === 'letter' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl">Generated Cover Letter</h3>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(packet.content.coverLetter, 'letter')}>
                  {copied === 'letter' ? 'Copied!' : <><Copy className="w-4 h-4 mr-2" /> Copy to Clipboard</>}
                </Button>
              </div>
              <Card className="p-1">
                <Textarea
                  className="min-h-[600px] bg-transparent border-0 text-sm leading-loose p-10 focus-visible:ring-0"
                  value={packet.content.coverLetter}
                  onChange={(event) =>
                    setPacket({
                      ...packet,
                      content: { ...packet.content, coverLetter: event.target.value },
                    })
                  }
                />
              </Card>
            </div>
          )}

          {activeTab === 'answers' && (
            <div className="space-y-6">
              <h3 className="text-xl">Application Question Pack</h3>
              <div className="space-y-6">
                {packet.content.applicationAnswers.map((item, index) => (
                  <Card key={item.question} className="p-6 space-y-4">
                    <p className="text-xs font-bold text-steel uppercase tracking-widest">{item.question}</p>
                    <Textarea
                      className="bg-graphite-800 border-graphite-700 h-32"
                      value={item.answer}
                      onChange={(event) => {
                        const applicationAnswers = [...packet.content.applicationAnswers];
                        applicationAnswers[index].answer = event.target.value;
                        setPacket({ ...packet, content: { ...packet.content, applicationAnswers } });
                      }}
                    />
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-6">
              <h3 className="text-xl">Submission Strategy</h3>
              <div className="space-y-3">
                {packet.checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => void toggleChecklist(item.id)}
                    className={cn(
                      'w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left',
                      item.completed
                        ? 'bg-signal-green/5 border-signal-green/20 text-signal-green'
                        : 'bg-graphite-900 border-graphite-800 text-mercury hover:border-graphite-700',
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                        item.completed ? 'bg-signal-green border-signal-green text-graphite-950' : 'bg-transparent border-graphite-700',
                      )}
                    >
                      {item.completed && <Check className="w-4 h-4" />}
                    </div>
                    <span className={cn('flex-1 font-medium', item.completed && 'line-through opacity-50')}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-8">
          <Card className="bg-graphite-900 overflow-hidden">
            <div className="bg-signal-green h-1 mt-[-1px]" />
            <CardContent className="p-6 space-y-6">
              <div>
                <h4 className="text-[10px] font-bold text-steel mb-4 uppercase tracking-widest">Packet Status</h4>
                <div className="flex items-center justify-between">
                  <Badge variant="orange" className="uppercase px-4 py-1">{packet.status}</Badge>
                  <span className="text-[10px] text-steel font-mono uppercase">ID: {packet.id.split('-')[1]}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-mercury">Ready-to-Send Check</span>
                  <span className="text-signal-green">{completion}%</span>
                </div>
                <div className="h-1 bg-graphite-800 rounded-full overflow-hidden">
                  <div className="h-full bg-signal-green transition-all" style={{ width: `${completion}%` }} />
                </div>
              </div>

              <div className="pt-4 border-t border-graphite-800 text-xs text-steel leading-relaxed">
                Final submission must be performed <span className="text-mercury font-bold">manually</span> on the employer portal. Use the workspace above to copy and paste your tailored content.
              </div>
            </CardContent>
          </Card>

          <Card className="bg-graphite-900 border-dashed">
            <CardContent className="p-6 text-center space-y-4">
              <FileText className="w-10 h-10 text-steel mx-auto opacity-20" />
              <div>
                <p className="text-sm font-bold text-mercury tracking-tight uppercase">Export Draft</p>
                <p className="text-[10px] text-steel uppercase mt-1">PDF and DOCX support can be added once the backend shape is locked.</p>
              </div>
              <Button variant="outline" className="w-full text-xs" disabled>Download Bundle</Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
