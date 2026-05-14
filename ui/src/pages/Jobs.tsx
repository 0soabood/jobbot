import { useState, useEffect, FormEvent } from 'react';
import { Search, SlidersHorizontal, MapPin, Clock, ExternalLink, CheckCircle2, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api/client';
import { JobListing } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  useEffect(() => {
    void loadJobs();
  }, []);

  const loadJobs = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchJobs(query);
      setJobs(data);
      if (data.length > 0 && !selectedJob) {
        setSelectedJob(data[0]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    void loadJobs(searchQuery);
  };

  const handleGeneratePacket = async (jobId: string) => {
    try {
      const packet = await api.generatePacket(jobId);
      navigate(`/applications/${packet.id}`);
    } catch (error: any) {
      alert(error.message || "Failed to generate packet. Please check your credits.");
    }
  };

  return (
    <div className="space-y-8 h-[calc(100vh-140px)] flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl mb-1">Target Intelligence</h1>
          <p className="text-steel text-sm">High-signal roles ranked against your current profile.</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
            <Input
              placeholder="Search companies, roles..."
              className="pl-10"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
          <Button variant="outline" size="icon" type="button">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </form>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
        <div className="w-full lg:w-[450px] overflow-y-auto pr-2 space-y-4 scrollbar-thin">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 bg-graphite-900 rounded-2xl animate-pulse" />
            ))
          ) : error ? (
            <div className="text-center py-20 text-burn-orange space-y-3">
              <p>Unable to load jobs: {error}</p>
              <Button onClick={() => void loadJobs(searchQuery || undefined)}>Retry</Button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 text-steel">
              <Search className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p>No jobs found.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={cn(
                  'w-full text-left p-5 rounded-2xl border transition-all duration-200 group',
                  selectedJob?.id === job.id
                    ? 'bg-graphite-800 border-signal-green shadow-[0_0_20px_-5px_rgba(0,255,65,0.2)]'
                    : 'bg-graphite-900 border-graphite-800 hover:border-graphite-700 hover:bg-graphite-800/50',
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-steel uppercase tracking-widest">{job.company}</span>
                    <div className="w-1 h-1 rounded-full bg-steel/30" />
                    <span className="text-[10px] font-mono text-steel uppercase tracking-widest">{job.location}</span>
                  </div>
                  <div
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold font-mono',
                      job.score.overall >= 90 ? 'bg-signal-green text-graphite-950' : 'bg-graphite-700 text-mercury',
                    )}
                  >
                    {job.score.overall}% MATCH
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-3 text-mercury group-hover:text-signal-green transition-colors">{job.title}</h3>

                <div className="flex flex-wrap gap-2">
                  {job.type && <Badge variant="outline" className="text-[10px]">{job.type}</Badge>}
                  {job.score.matchReasons.slice(0, 1).map((reason) => (
                    <Badge
                      key={reason}
                      variant="default"
                      className="text-[10px] bg-signal-green/10 text-signal-green border-signal-green/20"
                    >
                      High Signal: {reason.split(' ')[0]}
                    </Badge>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="hidden lg:block flex-1 overflow-y-auto glass-panel p-8 rounded-3xl scrollbar-thin relative selection:bg-signal-green selection:text-graphite-950">
          {selectedJob ? (
            <div className="space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <Badge variant="outline" className="border-signal-green/30 text-signal-green">
                    SYSTEM SCORING COMPLETE
                  </Badge>
                  <h2 className="text-4xl">{selectedJob.title}</h2>
                  <div className="flex items-center gap-6 text-steel">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {selectedJob.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {new Date(selectedJob.postedAt).toLocaleDateString()}
                    </div>
                    {selectedJob.salary && (
                      <div className="text-mercury font-mono text-sm bg-graphite-800 px-2 py-0.5 rounded">
                        {selectedJob.salary}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-display font-black text-signal-green mb-1">{selectedJob.score.overall}%</div>
                  <div className="text-[10px] font-mono font-bold text-steel uppercase tracking-widest">FIT SCORE</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-signal-green/5 border-signal-green/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-signal-green uppercase tracking-widest">Why it fits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedJob.score.matchReasons.map((reason) => (
                        <li key={reason} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-signal-green shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-burn-orange/5 border-burn-orange/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-burn-orange uppercase tracking-widest">ATS Gaps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedJob.score.missingKeywords.map((keyword) => (
                        <li key={keyword} className="text-sm flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full border border-burn-orange/50 flex items-center justify-center text-[8px] mt-0.5">!</div>
                          <span className="text-steel">Missing: <span className="text-mercury font-medium">{keyword}</span></span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl">Description</h3>
                <div className="text-steel leading-relaxed space-y-4 text-sm font-medium">
                  <p>{selectedJob.description}</p>
                  <p>This detail panel is connected to the live workspace data and stays aligned with the packet-generation flow used by the CLI.</p>
                </div>
              </div>

              <div className="sticky bottom-0 mt-20 pt-10 pb-2 bg-gradient-to-t from-graphite-900 to-transparent flex items-center justify-between">
                <Button variant="ghost" className="gap-2" onClick={() => window.open(selectedJob.url, '_blank')}>
                  Original Listing <ExternalLink className="w-4 h-4" />
                </Button>
                <div className="flex gap-4">
                  <Link to={`/jobs/${selectedJob.id}`}>
                    <Button variant="outline">Open Detail</Button>
                  </Link>
                  <Button className="h-12 px-8 text-base" onClick={() => handleGeneratePacket(selectedJob.id)}>
                    Generate Application Packet
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-steel">
              <Zap className="w-12 h-12 mb-4 opacity-10" />
              <p>Select a job to view deep signal analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
