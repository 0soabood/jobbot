import { useState, useEffect } from 'react';
import { TrendingUp, Search, FileText, CircleCheck, ArrowRight, Zap, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { DashboardStats } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    void loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-32 bg-graphite-900 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-48 bg-graphite-900 rounded-2xl" />
          <div className="h-48 bg-graphite-900 rounded-2xl" />
          <div className="h-48 bg-graphite-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl mb-2">Command Center</h1>
          <p className="text-steel font-medium">Your current search signal and application packet activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/jobs">
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" /> Find Jobs
            </Button>
          </Link>
          <Link to="/onboarding">
            <Button className="gap-2">
              <Zap className="w-4 h-4" /> Edit Profile
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-signal-green/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-steel">Momentum</CardTitle>
            <TrendingUp className="w-4 h-4 text-signal-green" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">+{stats.momentumScore}%</div>
            <p className="text-xs text-signal-green mt-1">Weekly search activity is trending up.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-steel">Available Credits</CardTitle>
            <Coins className="w-4 h-4 text-burn-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{(stats as any).credits ?? 0}</div>
            <p className="text-xs text-steel mt-1">Packets available to generate.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-steel">Active Packets</CardTitle>
            <FileText className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{stats.activeSearches}</div>
            <p className="text-xs text-steel mt-1">Drafted or in review.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-steel">Profile Readiness</CardTitle>
            <CircleCheck className="w-4 h-4 text-signal-green" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-display font-bold">{stats.profileCompletion}%</div>
            <Progress value={stats.profileCompletion} className="h-1" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Recent Application Packets</h2>
            <Link to="/applications" className="text-sm text-signal-green hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {stats.recentPackets.map((packet) => (
              <Card key={packet.id} className="group hover:border-signal-green/30 transition-all">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-graphite-800 rounded-xl flex items-center justify-center font-bold text-xl text-steel group-hover:text-signal-green">
                      {packet.companyName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-mercury leading-tight">{packet.jobTitle}</h3>
                      <p className="text-sm text-steel">{packet.companyName} - Created {new Date(packet.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-mono px-2 py-1 bg-graphite-800 rounded border border-graphite-700 text-steel uppercase">
                        {packet.status}
                      </span>
                    </div>
                    <Link to={`/applications/${packet.id}`}>
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
            {stats.recentPackets.length === 0 && (
              <div className="h-40 glass-panel border-dashed border-2 flex flex-col items-center justify-center text-steel gap-2 rounded-2xl">
                <FileText className="w-8 h-8 opacity-20" />
                <p>No application packets generated yet.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <h2 className="text-xl">Today's Momentum</h2>
          <Card className="bg-signal-green/5 border-signal-green/10">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-mercury italic-display lowercase">Weekly Search Goal</span>
                  <span className="text-signal-green">12 / 15</span>
                </div>
                <Progress value={80} className="bg-signal-green/20" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-mercury italic-display lowercase">Resume Tailoring Rate</span>
                  <span className="text-signal-green">94%</span>
                </div>
                <Progress value={94} className="bg-signal-green/20" />
              </div>

              <div className="pt-4 border-t border-signal-green/10">
                <p className="text-xs text-steel leading-relaxed">
                  Your profile currently lines up best with product operations and workflow automation roles. Prioritize the highest-scoring packets first.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-burn-orange/5 border-burn-orange/10">
            <CardContent className="p-6">
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-burn-orange/20 rounded-lg">
                  <Zap className="w-5 h-5 text-burn-orange" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-mercury uppercase mb-1">AI Tip</h4>
                  <p className="text-xs text-steel leading-relaxed">
                    Keep the first three resume bullets tightly aligned with the job title and reuse language from the posting where it is truthful.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
