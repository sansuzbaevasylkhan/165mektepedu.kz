"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  UserCheck,
  UserX,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  Download,
  ArrowUpRight,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({ title, value, icon: Icon, color, description }: any) {
  return (
    <div className="p-6 rounded-3xl border border-white/5 bg-[#0f0f0f] shadow-sm flex flex-col gap-4 transition-all hover:border-white/10">
      <div className="flex items-center justify-between">
        <div className={cn("h-12 w-12 rounded-2xl bg-muted flex items-center justify-center", color)}>
          <Icon className="h-6 w-6" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-white/20" />
      </div>
      <div className="text-left">
        <p className="text-sm text-white/50">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {description && <p className="text-xs text-white/30 mt-1">{description}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'online' | 'today' | 'inactive' }) {
  const configs = {
    online: { label: 'Онлайн', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: '🟢' },
    today: { label: 'Бүгін кірді', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: '🟡' },
    inactive: { label: 'Белсенді емес', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: '🔴' },
  };
  const config = configs[status];
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1 w-fit", config.color)}>
      <span>{config.icon}</span> {config.label}
    </span>
  );
}

export default function DirectorDashboard() {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    onlineNow: 0,
    activeToday: 0,
    inactiveToday: 0,
    gradesToday: 0,
    scheduleChangesToday: 0,
  });
  const [teachers, setTeachers] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const { count: totalTeachers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'teacher');

        const { count: onlineNow } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'teacher')
          .gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

        const { data: summary } = await supabase.from('teacher_activity_summary').select('*');
        const activeToday = summary?.filter(t => t.daily_activity_count > 0).length || 0;
        const inactiveToday = (totalTeachers || 0) - activeToday;

        const { count: gradesToday } = await supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', 'grades')
          .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());

        const { count: scheduleChangesToday } = await supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', 'schedule')
          .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());

        setStats({
          totalTeachers: totalTeachers || 0,
          onlineNow: onlineNow || 0,
          activeToday,
          inactiveToday,
          gradesToday: gradesToday || 0,
          scheduleChangesToday: scheduleChangesToday || 0,
        });

        const { data: teacherData } = await supabase.from('teacher_activity_summary').select('*');
        const enrichedTeachers = (teacherData || []).map(t => {
          const lastSeen = t.last_seen_at ? new Date(t.last_seen_at) : null;
          let status: 'online' | 'today' | 'inactive' = 'inactive';
          if (lastSeen && lastSeen.getTime() > Date.now() - 5 * 60 * 1000) status = 'online';
          else if (lastSeen && lastSeen.getTime() > new Date().setHours(0,0,0,0)) status = 'today';
          return { ...t, status };
        }).sort((a, _b) => (a.status === 'inactive' ? -1 : 1));

        setTeachers(enrichedTeachers);

        const { data: logs } = await supabase
          .from('activity_logs')
          .select('*, profiles(first_name, last_name)')
          .order('created_at', { ascending: false })
          .limit(20);

        setRecentLogs(logs || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();

    const channel = supabase
      .channel('direktor-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setRecentLogs(prev => [payload.new, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredTeachers = teachers.filter(t => {
    if (filter === 'active') return t.status === 'online' || t.status === 'today';
    if (filter === 'inactive') return t.status === 'inactive';
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Аты-жөні', 'Соңғы кіру', 'Күнделікті белсенділік'];
    const rows = teachers.map(t => [t.full_name, t.last_seen_at, t.daily_activity_count]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `teacher_activity_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 rounded-3xl bg-white/5" />)}
      </div>
      <div className="h-96 rounded-3xl bg-white/5" />
      <div className="h-96 rounded-3xl bg-white/5" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-white">Директор бақылау орталығы</h1>
          <p className="text-white/50">Мектептегі барлық әрекеттерді нақты уақытта бақылаңыз</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all border border-white/10"
        >
          <Download className="h-4 w-4" /> Есепті жүктеу (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Барлық мұғалімдер" value={stats.totalTeachers} icon={Users} color="text-blue-400" description="Жалпы тізім" />
        <StatCard title="Қазір онлайн" value={stats.onlineNow} icon={UserCheck} color="text-emerald-400" description="Соңғы 5 минут ішінде" />
        <StatCard title="Бүгін белсенді" value={stats.activeToday} icon={CheckCircle} color="text-indigo-400" description="Кемі 1 әрекет жасады" />
        <StatCard title="Бүгін белсенді емес" value={stats.inactiveToday} icon={UserX} color="text-red-400" description="Әрекет жасаған жоқ" />
        <StatCard title="Қойылған бағалар" value={stats.gradesToday} icon={FileText} color="text-orange-400" description="Бүгінгі жалпы сан" />
        <StatCard title="Кесте өзгерістері" value={stats.scheduleChangesToday} icon={Calendar} color="text-purple-400" description="Бүгінгі өзгерістер саны" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Мұғалімдердің белсенділігі
            </h3>
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
              {['all', 'active', 'inactive'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    filter === f ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"
                  )}
                >
                  {f === 'all' ? 'Барлығы' : f === 'active' ? 'Белсенді' : 'Белсенді емес'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#0f0f0f]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/40 font-medium">
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4">Мұғалім</th>
                    <th className="px-6 py-4">Статус</th>
                    <th className="px-6 py-4">Соңғы кіру</th>
                    <th className="px-6 py-4 text-right">Бүгінгі әрекет</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTeachers.length > 0 ? filteredTeachers.map((t, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{t.full_name}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4 text-white/50">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {t.last_seen_at ? new Date(t.last_seen_at).toLocaleString('kk-KZ') : 'Белгісіз'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-white/70">{t.daily_activity_count}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-white/30 italic">Деректер жоқ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" /> Соңғы әрекеттер
          </h3>
          <div className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-4 h-[600px] overflow-y-auto space-y-4 custom-scrollbar">
            {recentLogs.length > 0 ? recentLogs.map((log, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 transition-all hover:bg-white/[0.04]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    {log.entity_type === 'grades' ? 'Баға' : log.entity_type === 'schedule' ? 'Кесте' : log.entity_type}
                  </span>
                  <span className="text-[10px] text-white/30">
                    {new Date(log.created_at).toLocaleTimeString('kk-KZ')}
                  </span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {log.description}
                  {log.profiles && ` — ${log.profiles.first_name} ${log.profiles.last_name}`}
                </p>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="text-[10px] font-mono text-white/30 p-2 bg-black/30 rounded-lg mt-2">
                    {JSON.stringify(log.metadata).slice(0, 100)}...
                  </div>
                )}
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-white/30 italic text-center p-8">
                <p>Әзірге әрекеттер тізімі бос</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
