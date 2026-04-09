# Sentinel Security Dashboard - Week 5

## Goal
Learn ethical hacking techniques, exploit vulnerabilities in a test environment, and enhance application security.

## Ethical Hacking Report (Penetration Test Summary)

### 1. Reconnaissance & OSINT
- **Technique**: Port scanning and service fingerprinting.
- **Findings**: 
    - Port 80/443 open.
    - Server identified as `Express/4.21.2`.
    - Exposed debug endpoint discovered: `/api/debug/sql-vulnerable`.
- **Risk**: Information disclosure allows attackers to tailor exploits for specific software versions.

### 2. SQL Injection (SQLi) Exploitation
- **Vulnerability**: The `/api/debug/sql-vulnerable` endpoint was found to be vulnerable to boolean-based and union-based SQL injection.
- **Exploit**: Using a payload like `1 OR 1=1`, an attacker could bypass ID filtering and dump the entire user database.
- **Remediation**: Replaced raw string concatenation with **Prepared Statements** (simulated via strict type casting and parameterized logic) in the `/api/debug/sql-secure` endpoint.

### 3. Cross-Site Request Forgery (CSRF)
- **Vulnerability**: Profile update actions (`/api/user/update-profile`) lacked token validation, allowing unauthorized state changes via malicious third-party sites.
- **Remediation**: Implemented `csurf` middleware. The server now requires a valid CSRF token in the `x-csrf-token` header for all state-changing requests.

## New Features Implemented

### Ethical Hacking Lab
- **Recon Simulator**: Interactive tool to simulate port scanning and service discovery.
- **SQLi Lab**: Interactive environment to test `1 OR 1=1` payloads against vulnerable vs. secure endpoints.
- **CSRF Lab**: Demonstration of how CSRF tokens block unauthorized requests.

## Tech Stack Enhancements
- **Middleware**: `csurf`, `cookie-parser`.
- **Security Logic**: Prepared statements simulation, CSRF token lifecycle management.

## How to Test
1. **SQLi**: Go to the "Ethical Hacking Lab" tab. Enter `1 OR 1=1` in the SQLi input. Click "Exploit Vulnerable" to see the full data dump, then click "Test Secure" to see how the fix neutralizes the attack.
2. **CSRF**: Click "Simulate CSRF Attack" to see the request fail due to a missing token. Click "Authorized Update" to see a successful request using the valid token.
3. **Recon**: Click "Start Recon Scan" to see the simulated discovery process.
