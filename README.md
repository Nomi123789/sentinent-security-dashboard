# Sentinel Security Dashboard - Week 4

## Goal
Implement advanced security measures, detect threats in real-time, and secure API endpoints.

## Features Implemented

### 1. Intrusion Detection & Monitoring
- **Real-time Monitoring**: Custom middleware in `server.ts` tracks all incoming requests and logs security-relevant events.
- **Alert System**: The system detects multiple failed login attempts. If an IP fails to log in 5 times, it is automatically blocked.
- **Security Dashboard**: A React-based dashboard provides a live feed of security logs, blocked IPs, and brute-force statistics.

### 2. API Security Hardening
- **Rate Limiting**: Integrated `express-rate-limit` to prevent brute-force and DoS attacks. Configured to allow 100 requests per 15 minutes per IP.
- **CORS Configuration**: Properly configured CORS using the `cors` middleware to restrict access to authorized origins.
- **API Hardening**: API endpoints are protected by the intrusion detection system and rate limiters.

### 3. Security Headers & CSP Implementation
- **Helmet.js**: Integrated `helmet` to automatically set secure HTTP headers.
- **Content Security Policy (CSP)**: Implemented a strict CSP to prevent script injections and unauthorized resource loading.
- **HSTS**: Enforced HTTPS using `Strict-Transport-Security` headers with a 1-year max-age.

## Tech Stack
- **Backend**: Node.js, Express, Helmet, Express-Rate-Limit, CORS.
- **Frontend**: React, Tailwind CSS, Shadcn/UI, Recharts, Framer Motion.
- **Development**: Vite, TSX.

## How to Test
1. **Brute Force Detection**: Go to the "Security Testing Lab" in the dashboard. Try logging in with incorrect credentials multiple times. Watch the "Failed Logins" count increase and eventually see your IP get blocked.
2. **Rate Limiting**: Use the "Ping API Endpoint" button repeatedly. After 100 requests (or as configured), you will receive a 429 error, and the event will be logged.
3. **Security Headers**: Inspect the network tab in your browser to see the `Content-Security-Policy` and `Strict-Transport-Security` headers on every response.
