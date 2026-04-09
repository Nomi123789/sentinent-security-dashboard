import express from 'express';
import { createServer as createViteServer } from 'vite';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- Security Monitoring State ---
  const securityLogs: any[] = [];
  const blockedIPs = new Set<string>();
  const failedAttempts: Record<string, number> = {};

  // Mock Database for SQLi Demo
  const mockUserDb = [
    { id: 1, username: 'admin', email: 'admin@sentinel.io', role: 'superuser' },
    { id: 2, username: 'analyst', email: 'analyst@sentinel.io', role: 'staff' },
    { id: 3, username: 'guest', email: 'guest@example.com', role: 'viewer' }
  ];

  // Helper to log security events
  const logSecurityEvent = (type: string, message: string, ip: string, severity: 'low' | 'medium' | 'high' = 'low') => {
    const event = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message,
      ip,
      severity
    };
    securityLogs.unshift(event);
    if (securityLogs.length > 100) securityLogs.pop();
    console.log(`[SECURITY ${severity.toUpperCase()}] ${type}: ${message} (IP: ${ip})`);
  };

  // --- 1. Intrusion Detection Middleware ---
  app.use((req, res, next) => {
    const ip = req.ip || 'unknown';
    
    if (blockedIPs.has(ip)) {
      logSecurityEvent('Intrusion blocked', 'Blocked IP attempted access', ip, 'high');
      return res.status(403).json({ error: 'Your IP has been blocked due to suspicious activity.' });
    }
    next();
  });

  // --- 2. Security Headers (Helmet) ---
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https://picsum.photos", "https://*.googleusercontent.com"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for Vite/React dev
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // --- 3. Rate Limiting ---
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const ip = req.ip || 'unknown';
      logSecurityEvent('Rate Limit Exceeded', 'IP hit rate limit', ip, 'medium');
      res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
  });

  // --- 4. CORS Configuration ---
  app.use(cors({
    origin: process.env.APP_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-csrf-token'],
    credentials: true
  }));

  app.use(express.json());
  app.use(cookieParser());

  // --- 5. CSRF Protection ---
  const csrfProtection = csrf({ cookie: true });
  
  // Endpoint to get CSRF token
  app.get('/api/security/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // --- API Routes ---

  // Security Dashboard Data
  app.get('/api/security/stats', (req, res) => {
    res.json({
      logs: securityLogs,
      blockedCount: blockedIPs.size,
      failedAttempts: Object.keys(failedAttempts).length
    });
  });

  // Mock Login (to test failed attempts)
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip || 'unknown';

    // Mock logic: only 'admin'/'password' works
    if (username === 'admin' && password === 'password') {
      delete failedAttempts[ip];
      return res.json({ success: true, message: 'Logged in successfully' });
    }

    // Track failed attempts
    failedAttempts[ip] = (failedAttempts[ip] || 0) + 1;
    logSecurityEvent('Failed Login', `Failed login attempt for user: ${username}`, ip, 'medium');

    if (failedAttempts[ip] >= 5) {
      blockedIPs.add(ip);
      logSecurityEvent('IP Blocked', 'Multiple failed login attempts detected', ip, 'high');
      return res.status(403).json({ error: 'Too many failed attempts. Your IP has been blocked.' });
    }

    res.status(401).json({ error: 'Invalid credentials' });
  });

  // --- SQL Injection Demo Endpoints ---

  // VULNERABLE Endpoint (Simulated)
  app.post('/api/debug/sql-vulnerable', (req, res) => {
    const { userId } = req.body;
    const ip = req.ip || 'unknown';

    logSecurityEvent('SQLi Probe', `Vulnerable endpoint accessed with ID: ${userId}`, ip, 'medium');

    // Simulation of: SELECT * FROM users WHERE id = ${userId}
    // If userId is "1 OR 1=1", it would return all users
    if (userId.toString().includes('OR') || userId.toString().includes('=')) {
      logSecurityEvent('SQLi Attempt', 'Potential SQL Injection detected in debug endpoint', ip, 'high');
      return res.json({ 
        warning: 'VULNERABILITY EXPLOITED',
        query: `SELECT * FROM users WHERE id = ${userId}`,
        results: mockUserDb // Returns everything
      });
    }

    const user = mockUserDb.find(u => u.id.toString() === userId.toString());
    res.json({ results: user ? [user] : [] });
  });

  // SECURE Endpoint (Prepared Statements Simulation)
  app.post('/api/debug/sql-secure', (req, res) => {
    const { userId } = req.body;
    
    // Simulation of Prepared Statement: SELECT * FROM users WHERE id = ?
    // The input is cast to a number, neutralizing injection
    const safeId = parseInt(userId);
    const user = mockUserDb.find(u => u.id === safeId);
    
    res.json({ 
      results: user ? [user] : [],
      method: 'Prepared Statement (Parameterized Query)'
    });
  });

  // --- CSRF Demo Endpoint ---
  app.post('/api/user/update-profile', csrfProtection, (req, res) => {
    const { email } = req.body;
    const ip = req.ip || 'unknown';
    
    logSecurityEvent('Profile Update', `User updated email to: ${email}`, ip, 'low');
    res.json({ success: true, message: 'Profile updated securely with CSRF protection.' });
  });

  // Test Rate Limiting
  app.get('/api/test/rate-limit', apiLimiter, (req, res) => {
    res.json({ message: 'Request successful' });
  });

  // Reset Security (for demo purposes)
  app.post('/api/security/reset', (req, res) => {
    blockedIPs.clear();
    Object.keys(failedAttempts).forEach(key => delete failedAttempts[key]);
    securityLogs.length = 0;
    res.json({ message: 'Security state reset' });
  });

  // --- Vite / Static Files ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
