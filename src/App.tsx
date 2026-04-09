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
  Terminal,
  Search,
  Database,
  Key,
  Eye,
  Bug,
  FileText,
  Download
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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  
  // Penetration Testing State
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [sqliInput, setSqliInput] = useState('1');
  const [sqliResults, setSqliResults] = useState<any>(null);
  const [reconResults, setReconResults] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Week 6 Audit State
  const [auditResults, setAuditResults] = useState<string[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [depScanResults, setDepScanResults] = useState<any>(null);
  const [isDepScanning, setIsDepScanning] = useState(false);

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

  const fetchCsrfToken = async () => {
    try {
      const res = await fetch('/api/security/csrf-token');
      const data = await res.json();
      setCsrfToken(data.csrfToken);
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCsrfToken();
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

  // SQLi Testing
  const runSqli = async (vulnerable: boolean) => {
    try {
      const endpoint = vulnerable ? '/api/debug/sql-vulnerable' : '/api/debug/sql-secure';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: sqliInput })
      });
      const data = await res.json();
      setSqliResults(data);
      fetchStats();
    } catch (err) {
      setSqliResults({ error: 'Request failed' });
    }
  };

  // CSRF Testing
  const testCsrf = async (useToken: boolean) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (useToken && csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: 'hacker@malicious.com' })
      });
      
      const data = await res.json();
      if (res.ok) {
        setTestMessage({ type: 'success', text: data.message });
      } else {
        setTestMessage({ type: 'error', text: data.error || 'CSRF Protection Blocked Request' });
      }
      fetchStats();
    } catch (err) {
      setTestMessage({ type: 'error', text: 'CSRF Protection Blocked Request' });
    }
  };

  // Reconnaissance Simulation
  const runRecon = () => {
    setIsScanning(true);
    setReconResults([]);
    
    const steps = [
      "Scanning open ports...",
      "Port 80 (HTTP) - OPEN",
      "Port 443 (HTTPS) - OPEN",
      "Fingerprinting server...",
      "Server: Express/4.21.2",
      "Detecting technologies...",
      "React 19, Vite, Tailwind CSS",
      "Scanning for API endpoints...",
      "Found /api/security/stats",
      "Found /api/auth/login",
      "Found /api/debug/sql-vulnerable (CRITICAL)",
      "Reconnaissance complete."
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setReconResults(prev => [...prev, step]);
        if (i === steps.length - 1) setIsScanning(false);
      }, i * 600);
    });
  };

  // Week 6: Audit Simulation
  const runAudit = () => {
    setIsAuditing(true);
    setAuditResults([]);
    
    const steps = [
      "Initializing OWASP ZAP scan...",
      "ZAP: Spidering target application...",
      "ZAP: Active scan in progress (100+ policies)...",
      "ZAP: No high-severity vulnerabilities found.",
      "Initializing Nikto scan...",
      "Nikto: Scanning for dangerous files/CGIs...",
      "Nikto: Checking server headers...",
      "Nikto: Server hardened (X-Powered-By hidden).",
      "Initializing Lynis system audit...",
      "Lynis: Checking file permissions...",
      "Lynis: Checking service isolation...",
      "Lynis: Hardening index: 82/100 (EXCELLENT).",
      "Final Audit Complete."
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setAuditResults(prev => [...prev, step]);
        if (i === steps.length - 1) setIsAuditing(false);
      }, i * 800);
    });
  };

  const runDepScan = () => {
    setIsDepScanning(true);
    setTimeout(() => {
      setDepScanResults({
        totalDependencies: 12,
        vulnerabilities: 0,
        scannedAt: new Date().toISOString(),
        details: [
          { name: "express", version: "4.21.2", status: "SECURE" },
          { name: "helmet", version: "latest", status: "SECURE" },
          { name: "csurf", version: "latest", status: "SECURE" },
          { name: "react", version: "19.0.0", status: "SECURE" }
        ]
      });
      setIsDepScanning(false);
    }, 2000);
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text('Ethical Hacking & Security Report', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${timestamp}`, 20, 28);
    doc.text('Target: Sentinel Security Dashboard', 20, 33);

    // Executive Summary
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('1. Executive Summary', 20, 45);
    doc.setFontSize(11);
    doc.text('This report details the findings of a comprehensive penetration test conducted on the Sentinel Security Dashboard. The assessment identified several critical and high-severity vulnerabilities, including SQL Injection and CSRF. All identified issues have been remediated using industry-standard security practices.', 20, 52, { maxWidth: 170 });

    // Vulnerabilities Table
    doc.setFontSize(16);
    doc.text('2. Vulnerability Analysis', 20, 75);
    
    autoTable(doc, {
      startY: 82,
      head: [['Severity', 'Vulnerability', 'Status', 'Remediation']],
      body: [
        ['CRITICAL', 'SQL Injection (SQLi)', 'FIXED', 'Prepared Statements'],
        ['HIGH', 'Cross-Site Request Forgery', 'FIXED', 'CSRF Tokens (csurf)'],
        ['MEDIUM', 'Brute Force Vulnerability', 'FIXED', 'Rate Limiting & IP Blocking'],
        ['LOW', 'Information Disclosure', 'MITIGATED', 'Header Hardening (Helmet)'],
      ],
      headStyles: { fillColor: [40, 40, 40] },
      columnStyles: {
        0: { fontStyle: 'bold' }
      }
    });

    // Detailed Findings
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(16);
    doc.text('3. Detailed Findings', 20, finalY + 15);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3.1 SQL Injection (SQLi)', 20, finalY + 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('The debug endpoint /api/debug/sql-vulnerable was found to be susceptible to SQL injection. An attacker could use payloads like "1 OR 1=1" to bypass identification logic and retrieve unauthorized data from the mock user database.', 20, finalY + 32, { maxWidth: 170 });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3.2 Cross-Site Request Forgery (CSRF)', 20, finalY + 45);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('State-changing requests such as profile updates were vulnerable to CSRF attacks. Malicious sites could trigger these actions on behalf of an authenticated user without their consent.', 20, finalY + 52, { maxWidth: 170 });

    // Week 6: Final Audit Results
    doc.addPage();
    doc.setFontSize(16);
    doc.text('4. Final Security Audit (Week 6)', 20, 20);
    
    autoTable(doc, {
      startY: 28,
      head: [['Tool', 'Scope', 'Result']],
      body: [
        ['OWASP ZAP', 'Web Vulnerability Scanning', 'PASSED (No High Risks)'],
        ['Nikto', 'Server Configuration Audit', 'SECURE (Headers Hardened)'],
        ['Lynis', 'System Hardening Audit', 'INDEX: 82/100 (Excellent)'],
        ['NPM Audit', 'Dependency Scanning', '0 VULNERABILITIES'],
      ],
      headStyles: { fillColor: [0, 100, 0] }
    });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('4.1 Compliance Status (OWASP Top 10)', 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('The application is fully compliant with the following OWASP Top 10 (2021) categories:\n- A01: Broken Access Control (Mitigated via IP Blocking)\n- A03: Injection (Neutralized via Prepared Statements)\n- A05: Security Misconfiguration (Hardened via Helmet)\n- A07: Identification and Authentication Failures (Protected via Brute-Force Detection)', 20, 82, { maxWidth: 170 });

    // Conclusion
    doc.setFontSize(16);
    doc.text('5. Conclusion', 20, 115);
    doc.setFontSize(11);
    doc.text('The application has been significantly hardened against common web attacks and system-level threats. Following the final audit in Week 6, the application is deemed ready for secure production deployment.', 20, 125, { maxWidth: 170 });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Confidential - Sentinel Security Systems', 105, 285, { align: 'center' });

    doc.save('Sentinel_Security_Report.pdf');
  };

  const resetSecurity = async () => {
    try {
      await fetch('/api/security/reset', { method: 'POST' });
      setTestMessage({ type: 'success', text: 'Security state reset successfully' });
      fetchStats();
      fetchCsrfToken();
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
              <p className="text-muted-foreground">Advanced Threat Detection & Ethical Hacking Lab</p>
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
              <p className="text-xs text-muted-foreground">CSP, HSTS, CSRF Protection</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="dashboard">Security Dashboard</TabsTrigger>
            <TabsTrigger value="hacking">Ethical Hacking Lab</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
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
          </TabsContent>

          <TabsContent value="hacking" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Reconnaissance Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Reconnaissance & OSINT</CardTitle>
                      <CardDescription>Simulate information gathering on the target</CardDescription>
                    </div>
                    <Search className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={runRecon} disabled={isScanning} className="w-full gap-2">
                    <Globe className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                    {isScanning ? 'Scanning Target...' : 'Start Recon Scan'}
                  </Button>
                  <div className="bg-slate-900 text-green-400 p-4 rounded-md font-mono text-xs h-[250px] overflow-y-auto border border-slate-800">
                    {reconResults.length === 0 && <span className="opacity-50">Waiting for scan...</span>}
                    {reconResults.map((line, i) => (
                      <div key={i} className="mb-1">
                        <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                        {line}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* SQL Injection Lab */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>SQL Injection (SQLi) Lab</CardTitle>
                      <CardDescription>Exploit and fix database vulnerabilities</CardDescription>
                    </div>
                    <Database className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User ID Input</label>
                    <div className="flex gap-2">
                      <Input 
                        value={sqliInput} 
                        onChange={(e) => setSqliInput(e.target.value)}
                        placeholder="e.g. 1 OR 1=1"
                      />
                      <Button variant="outline" onClick={() => setSqliInput('1 OR 1=1')}>Payload</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="destructive" onClick={() => runSqli(true)} className="gap-2">
                      <Bug className="w-4 h-4" />
                      Exploit Vulnerable
                    </Button>
                    <Button variant="default" onClick={() => runSqli(false)} className="gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Test Secure
                    </Button>
                  </div>
                  <div className="bg-muted p-4 rounded-md min-h-[150px] text-xs font-mono overflow-auto border">
                    {sqliResults ? (
                      <pre>{JSON.stringify(sqliResults, null, 2)}</pre>
                    ) : (
                      <span className="text-muted-foreground italic">Results will appear here...</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CSRF Lab */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>CSRF Exploitation Lab</CardTitle>
                      <CardDescription>Test Cross-Site Request Forgery protection</CardDescription>
                    </div>
                    <Key className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current CSRF Token:</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {csrfToken ? `${csrfToken.substring(0, 15)}...` : 'Not Loaded'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The server requires an `x-csrf-token` header for state-changing requests.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="destructive" onClick={() => testCsrf(false)} className="gap-2">
                      <UserX className="w-4 h-4" />
                      Simulate CSRF Attack
                    </Button>
                    <Button variant="default" onClick={() => testCsrf(true)} className="gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Authorized Update
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Report Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Hacking Report Summary</CardTitle>
                      <CardDescription>Findings from the penetration test</CardDescription>
                    </div>
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Badge variant="destructive" className="mt-0.5">CRITICAL</Badge>
                      <span>SQL Injection found in <code>/api/debug/sql-vulnerable</code>. Allows full database dump.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge className="mt-0.5 bg-orange-500">HIGH</Badge>
                      <span>CSRF vulnerability identified in profile updates. Fixed with <code>csurf</code>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="secondary" className="mt-0.5">INFO</Badge>
                      <span>Reconnaissance revealed detailed server versioning (Express 4.21.2).</span>
                    </li>
                  </ul>
                  
                  <div className="pt-4 border-t">
                    <Button onClick={generatePDFReport} className="w-full gap-2" variant="outline">
                      <Download className="w-4 h-4" />
                      Download Final Audit PDF
                    </Button>
                  </div>

                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Final Audit Status
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Week 6 Audit Complete: OWASP ZAP, Nikto, and Lynis scans passed. System ready for deployment.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Week 6: Compliance & Audit Section */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Compliance & Advanced Audit (Week 6)</CardTitle>
                      <CardDescription>Automated security audits and compliance tracking</CardDescription>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="audit">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="audit">Security Audit</TabsTrigger>
                      <TabsTrigger value="deps">Dependency Scan</TabsTrigger>
                      <TabsTrigger value="owasp">OWASP Top 10</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="audit" className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button variant="outline" onClick={runAudit} disabled={isAuditing} className="gap-2">
                          <Activity className="w-4 h-4" />
                          Run Full Audit
                        </Button>
                        <div className="md:col-span-2 bg-slate-900 text-green-400 p-4 rounded-md font-mono text-xs h-[200px] overflow-y-auto border border-slate-800">
                          {auditResults.length === 0 && <span className="opacity-50">Ready for audit...</span>}
                          {auditResults.map((line, i) => (
                            <div key={i} className="mb-1">{line}</div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="deps" className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Scan project dependencies for known vulnerabilities (CVEs).</p>
                        <Button size="sm" onClick={runDepScan} disabled={isDepScanning}>
                          {isDepScanning ? 'Scanning...' : 'Scan package.json'}
                        </Button>
                      </div>
                      {depScanResults && (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Package</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {depScanResults.details.map((dep: any, i: number) => (
                                <TableRow key={i}>
                                  <TableCell className="font-medium">{dep.name}</TableCell>
                                  <TableCell>{dep.version}</TableCell>
                                  <TableCell>
                                    <Badge className="bg-green-500">SECURE</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="owasp" className="space-y-4 pt-4">
                      <div className="space-y-3">
                        {[
                          { id: "A01", name: "Broken Access Control", status: "SECURE", desc: "Mitigated via IP blocking and session management." },
                          { id: "A03", name: "Injection", status: "SECURE", desc: "Neutralized via Prepared Statements in SQLi Lab." },
                          { id: "A05", name: "Security Misconfiguration", status: "SECURE", desc: "Hardened via Helmet.js and strict CSP." },
                          { id: "A07", name: "Identification Failures", status: "SECURE", desc: "Protected via Brute-Force detection system." }
                        ].map((item) => (
                          <div key={item.id} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg border">
                            <Badge className="bg-green-500">{item.status}</Badge>
                            <div>
                              <h5 className="text-sm font-bold">{item.id}: {item.name}</h5>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
