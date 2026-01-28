import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, HardDrive, Brain, Activity } from 'lucide-react';

export function DatabaseView() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 h-full">
      <Card className="bg-[#0f0f1a]/98 backdrop-blur-lg border border-cyan-500/20 col-span-full md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Memory Core Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Memories" value="1,248" icon={<Brain className="w-4 h-4" />} color="text-purple-400" />
            <StatCard label="Vector Indices" value="16" icon={<Activity className="w-4 h-4" />} color="text-blue-400" />
            <StatCard label="Storage Used" value="45 MB" icon={<HardDrive className="w-4 h-4" />} color="text-yellow-400" />
            <StatCard label="Uptime" value="99.9%" icon={<Activity className="w-4 h-4" />} color="text-green-400" />
          </div>
          <div className="mt-6 h-64 bg-black/20 rounded-lg border border-white/5 flex items-center justify-center text-white/30">
            Memory distribution visualization coming soon
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0f0f1a]/98 backdrop-blur-lg border border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">CPU Usage</span>
              <span className="text-white">12%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[12%]" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Memory Usage</span>
              <span className="text-white">45%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-[45%]" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Disk Usage</span>
              <span className="text-white">28%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[28%]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
