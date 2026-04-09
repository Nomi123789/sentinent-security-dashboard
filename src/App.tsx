import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  RefreshCw,
  UserX,
  Globe,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SecurityLog {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  ip: string;
  severity: 'low' | 'medium' | 'high';
}

interface SecurityStats {
  logs: SecurityLog[];
  blockedCount: number;
  failedAttempts: number;
}

export default function App() {
  const [stats, setStats] = useState<SecurityStats>({ logs: [], blockedCount: 0, failedAttempts: 0 });
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/security/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setTestMessage({ type: 'success', text: data.message });
      } else {
        setTestMessage({ type: 'error', text: data.error });
      }
      fetchStats();
    } catch (err) {
      setTestMessage({ type: 'error', text: 'Connection failed' });
    }
  };

  const testRateLimit = async () => {
    try {
      const res = await fetch('/api/test/rate-limit');
      const data = await res.json();
      if (res.ok) {
        setTestMessage({ type: 'success', text: data.message });
      } else {
        setTestMessage({ type: 'error', text: data.error });
      }
      fetchStats();
    } catch (err) {
      setTestMessage({ type: 'error', text: 'Rate limit hit or connection failed' });
    }
  };

  const resetSecurity = async () => {
    try {
      await fetch('/api/security/reset', { method: 'POST' });
      setTestMessage({ type: 'success', text: 'Security state reset successfully' });
      fetchStats();
    } catch (err) {
      setTestMessage({ type: 'error', text: 'Failed to reset security' });
    }
  };

  // Prepare chart data
  const chartData = stats.logs.slice(0, 20).reverse().map(log => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    severity: log.severity === 'high' ? 3 : log.severity === 'medium' ? 2 : 1
  }));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-orange-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sentinel Security</h1>
              <p className="text-muted-foreground">Advanced Threat Detection & API Hardening</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 gap-1.5 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              System Active
            </Badge>
            <Button variant="outline" size="icon" onClick={fetchStats} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="destructive" size="sm" onClick={resetSecurity}>
              Reset Security
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.logs.length}</div>
              <p className="text-xs text-muted-foreground">Real-time events tracked</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
              <UserX className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.blockedCount}</div>
              <p className="text-xs text-muted-foreground">Suspicious actors neutralized</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <Lock className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedAttempts}</div>
              <p className="text-xs text-muted-foreground">Brute-force attempts detected</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Security Headers</CardTitle>
              <ShieldCheck className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Enforced</div>
              <p className="text-xs text-muted-foreground">CSP, HSTS, XSS Protection</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Logs & Charts */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Threat Activity Timeline</CardTitle>
                <CardDescription>Severity of events over time (3 = High, 2 = Medium, 1 = Low)</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 4]} ticks={[1, 2, 3]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="severity" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorSeverity)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Intrusion Detection Logs</CardTitle>
                  <CardDescription>Real-time monitoring of system access and threats</CardDescription>
                </div>
                <Terminal className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[100px]">Severity</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead className="text-right">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {stats.logs.map((log) => (
                          <motion.tr 
                            key={log.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group hover:bg-muted/30 transition-colors"
                          >
                            <TableCell>
                              <Badge className={getSeverityColor(log.severity)}>
                                {log.severity.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{log.type}</TableCell>
                            <TableCell className="text-muted-foreground">{log.message}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Globe className="w-3 h-3 text-muted-foreground" />
                                <span className="font-mono text-xs">{log.ip}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                      {stats.logs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            No security events detected. System is secure.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Testing & Tools */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Security Testing Lab</CardTitle>
                <CardDescription>Simulate attacks to verify hardening measures</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="login">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Brute Force</TabsTrigger>
                    <TabsTrigger value="rate">Rate Limit</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login" className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Try logging in with incorrect credentials. 5 failed attempts will block your IP.
                    </p>
                    <form onSubmit={handleLogin} className="space-y-3">
                      <Input 
                        placeholder="Username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                      />
                      <Input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                      />
                      <Button type="submit" className="w-full gap-2">
                        <Unlock className="w-4 h-4" />
                        Attempt Login
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="rate" className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Spam this button to trigger the API rate limiter.
                    </p>
                    <Button onClick={testRateLimit} variant="outline" className="w-full gap-2">
                      <Activity className="w-4 h-4" />
                      Ping API Endpoint
                    </Button>
                  </TabsContent>
                </Tabs>

                {testMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <Alert variant={testMessage.type === 'error' ? 'destructive' : 'default'}>
                      {testMessage.type === 'error' ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      <AlertTitle>{testMessage.type === 'error' ? 'Security Triggered' : 'Success'}</AlertTitle>
                      <AlertDescription>{testMessage.text}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Protections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 text-green-500 rounded-md">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Rate Limiting</span>
                  </div>
                  <Badge variant="secondary">100 req/15m</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-md">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">CORS Policy</span>
                  </div>
                  <Badge variant="secondary">Restricted</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-md">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">CSP Headers</span>
                  </div>
                  <Badge variant="secondary">Strict</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 text-orange-500 rounded-md">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">HSTS Policy</span>
                  </div>
                  <Badge variant="secondary">1 Year</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
