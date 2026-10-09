# 🛡️ Fish Lens — Phishing URL & Email Forensic Analyzer

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Pytest](https://img.shields.io/badge/Tests-Pytest%2015%20Passed-emerald?style=flat&logo=pytest)](https://docs.pytest.org)
[![Security](https://img.shields.io/badge/SSRF%20Guard-Active-cyan?style=flat)](https://owasp.org)
[![Deployment](https://img.shields.io/badge/Deployable-Vercel-black?style=flat&logo=vercel)](https://vercel.com)

**Fish Lens** is a lightweight, database-free cybersecurity forensic tool built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. It inspects suspicious URLs and raw email headers/bodies in real-time, computing an animated composite risk score (0–100) with detailed explainable cards and safe multi-hop redirect tracing fortified against Server-Side Request Forgery (SSRF).

---

## 📸 Interface Preview & Screenshots

```
+---------------------------------------------------------------------------------------+
|  [FISH LENS]  v1.0-sec       [Analyzer]    [History]    [Learn & Intel]  (SSRF Guard)  |
+---------------------------------------------------------------------------------------+
|  HEURISTIC THREAT DETECTOR                                                            |
|  Analyze suspicious URLs & Emails in real-time.                                       |
+---------------------------------------------------------------------------------------+
|  [Quick Demos: PayPal Spoof | @ Symbol Trick | IP Hostname | CEO Fraud | Bank Anchor] |
+---------------------------------------------------------------------------------------+
|  $ Target Payload [URL or Raw Email with Headers]:                                    |
|  +---------------------------------------------------------------------------------+  |
|  | http://paypa1-account-security.xyz/login/verify.php                             |  |
|  +---------------------------------------------------------------------------------+  |
|  [Payload: 49 chars]                                     [ > Analyze Threat Payload ] |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   +---------------+   VERDICT: DANGEROUS (88 / 100 RISK)                              |
|   |   (( 88 ))    |   Phishing or Malicious Threat Indicators Identified              |
|   |    /100       |   Critical indicators point to active brand typosquatting,        |
|   +---------------+   unencrypted credentials, and suspicious TLD infrastructure.     |
|                                                                                       |
|   [Triggered Red Flags (4)]   [All Checks (10)]   [Redirect Timeline]   [Forensics]   |
|                                                                                       |
|   [!] Brand Impersonation (CRITICAL) - Mimics 'paypal' via Levenshtein / leetspeak    |
|   [!] High-Risk TLD (HIGH)           - Registered on suspicious .xyz extension        |
|   [!] Missing HTTPS (MEDIUM)         - Plaintext HTTP transport risks exposure        |
|   [!] Phishing Keywords (MEDIUM)     - High-risk terms 'login', 'verify' detected     |
|                                                                                       |
|   [ Copy JSON ]  [ Export Report JSON ]                                               |
+---------------------------------------------------------------------------------------+
```

*(Place screenshot images into `/public/screenshots/` for visual documentation.)*

---

## 🏛️ Architecture Overview

```
               [ User Input (URL or Raw Email) ]
                                |
                                v
               [ Unified Analysis Dispatcher ]
                (/src/lib/engine/index.ts)
                    /                       \
                   v                         v
       [ URL Forensic Engine ]       [ Email Forensic Engine ]
        - Levenshtein Brand Check     - From vs Reply-To Mismatch
        - Suspicious TLD (.xyz/.top)  - SPF / DKIM / DMARC Verification
        - IP as Hostname Detection    - Coercive Urgency Keywords
        - @ Symbol Userinfo Trick     - Anchor Text Destination Spoofing
        - Punycode & Homoglyphs       - Insecure HTTP Link Extract
        - Subdomain Stacking (>3)                    |
        - URL Shorteners & Length                    v
                   \                         /
                    v                       v
               [ Risk Scoring & Verdict Normalizer ]
                   (0-100 Score, Severity Caps)
                                |
                                v
               [ Next.js Presentation Layer ]
          - Animated Circular Risk Gauge (SVG)
          - Expandable Threat Diagnostic Cards
          - Browser LocalStorage History Archive
          - JSON Forensic Report Exporter
                                |
                                v
               [ SSRF-Protected Redirect Tracer ]
                 (/api/trace -> /src/lib/security)
          - DNS IP Resolution Validation
          - Blocks 127.0.0.0/8, 10.0.0.0/8, 192.168.0.0/16,
            172.16.0.0/12, 169.254.0.0/16, ::1, fc00::/7
          - Step-by-Step Manual 5-Hop HTTP Tracker
```

---

## 🔍 Heuristic Detection Vectors

| Threat Vector | Engine Check | Severity | Explanation |
| :--- | :--- | :--- | :--- |
| **Brand Typosquatting** | Levenshtein Matrix | `Critical` | Flags lookalike domains (e.g. `paypa1`, `micros0ft`) within edit distance threshold of top global brands. |
| **The @ Symbol Trick** | RFC 3986 Userinfo Parser | `Critical` | Detects URLs where everything before `@` is credential userinfo, steering browser to a secondary server. |
| **Homoglyphs & Punycode** | IDN & Unicode Map | `Critical` | Catches Cyrillic/Greek characters (e.g. Cyrillic `а`, `о`) disguised as Latin ASCII and `xn--` Punycode prefixes. |
| **Anchor Text Spoofing** | HTML AST Inspector | `Critical` | Flags deceptive links where visible anchor text (`https://bankofamerica.com`) routes to an unrelated domain. |
| **Email Authentication** | Auth-Results Parser | `Critical` | Identifies hard failures or missing cryptographic SPF, DKIM, and DMARC alignment headers. |
| **Direct IP Hostname** | Octet & IPv6 Regex | `High` | Flags raw numeric IP addresses hosting forms to evade domain reputation blocklists. |
| **Subdomain Stacking** | eTLD+1 Parser | `High` | Detects chaining of 3+ subdomains to truncate mobile address bars. |
| **Sender Mismatch** | Header Extractor | `High` | Flags discrepancies between the authoritative `From:` domain and the `Reply-To:` destination. |
| **Urgent Language** | Heuristic Lexicon | `High` | Detects coercive psychological triggers ("suspended within 24h", "arrest warrant"). |
| **Suspicious TLDs** | Watchlist Feed | `High` | Checks against top-level domains with high spam/phishing abuse rates (`.xyz`, `.top`, `.buzz`, `.icu`). |
| **Phishing Keywords** | Path & Query Parser | `Medium` | Flags credential harvesting traps (`login`, `verify`, `account`, `banking`, `wallet`). |
| **URL Shorteners** | Service Directory | `Medium` | Identifies link-shortening services (`bit.ly`, `tinyurl.com`, `t.co`) masking landing endpoints. |
| **Missing HTTPS** | Protocol Verifier | `Medium` | Flags unencrypted HTTP transmissions in URLs or embedded email links. |
| **Excessive Length** | Character Counter | `Low` | Detects long URLs (>85 chars) engineered to push malicious domains out of view. |

---

## 🛡️ SSRF (Server-Side Request Forgery) Defense

The redirect tracing route (`/api/trace`) follows up to 5 HTTP hops to reveal final destinations. To prevent exploitation against internal infrastructure or cloud instance metadata (e.g. `169.254.169.254`), Fish Lens enforces:

1. **Strict Protocol Whitelist**: Only `http:` and `https:` schemes are permitted; `file:`, `gopher:`, `ftp:`, etc., are rejected.
2. **DNS Pre-Resolution**: Hostnames are resolved through DNS lookup before making network requests.
3. **CIDR Blocklist Validation**:
   - `127.0.0.0/8` (Loopback)
   - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (RFC 1918 Private)
   - `169.254.0.0/16` (Link-local / AWS / GCP / Azure metadata endpoint)
   - `0.0.0.0/8`, `224.0.0.0/4`, `240.0.0.0/4` (Reserved / Multicast)
   - `::1`, `fe80::/10`, `fc00::/7` (IPv6 loopback & unique local)
4. **Per-Hop Re-Evaluation**: Every redirect location header is recursively parsed and re-validated against the SSRF guard before the next request is dispatched.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.18+ or v20+
- **pnpm** or **npm**
- **Python**: 3.10+ (for running pytest)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/fish-lens.git
cd fish-lens

# Install dependencies
pnpm install
```

### Running Locally
```bash
# Start the development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### Running Unit Tests (Pytest)
```bash
python -m pytest tests/ -v
```
Output:
```
tests/test_detection_engine.py::TestUrlHeuristics::test_levenshtein_lookalike_detection PASSED
tests/test_detection_engine.py::TestUrlHeuristics::test_suspicious_tld_detection PASSED
tests/test_detection_engine.py::TestUrlHeuristics::test_ip_address_hostname PASSED
tests/test_detection_engine.py::TestUrlHeuristics::test_excessive_subdomains PASSED
tests/test_detection_engine.py::TestUrlHeuristics::test_at_symbol_credential_trick PASSED
tests/test_detection_engine.py::TestUrlHeuristics::test_punycode_and_homoglyphs PASSED
tests/test_detection_engine.py::TestUrlHeuristics::test_url_shorteners PASSED
tests/test_detection_engine.py::TestUrlHeuristics::test_phishing_keywords PASSED
tests/test_detection_engine.py::TestUrlHeuristics::test_url_length PASSED
tests/test_detection_engine.py::TestEmailHeuristics::test_from_reply_to_mismatch PASSED
tests/test_detection_engine.py::TestEmailHeuristics::test_failed_and_missing_email_auth PASSED
tests/test_detection_engine.py::TestEmailHeuristics::test_urgent_threatening_language PASSED
tests/test_detection_engine.py::TestEmailHeuristics::test_anchor_text_spoofing PASSED
tests/test_detection_engine.py::TestSsrfProtection::test_private_and_local_ip_blocking PASSED
tests/test_detection_engine.py::TestSsrfProtection::test_public_ip_allowed PASSED

======================== 15 passed in 0.08s ========================
```

---

## ☁️ Deploying to Vercel

Fish Lens uses Next.js Route Handlers without requiring external databases or server daemons.

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/new).
3. The default Next.js build command (`next build`) runs automatically.
4. Deploy!

---

## 🔬 Tech Note

- **Stateless & Database-Free**: No database is required. Historical scans are preserved client-side via browser `localStorage`, keeping hosting costs at zero and eliminating data retention liabilities.
- **Route Handlers on Edge & Node**: The core detection engine executes pure algorithmic calculations (Levenshtein distances, regex tokenization, AST extraction) in milliseconds.
- **SSRF Defense at Application Layer**: The redirect chain tracer operates with manual redirect control (`redirect: 'manual'`), validating intermediate hops before standard HTTP client libraries can follow them automatically.

---

## ⚖️ Security Disclaimer

> **IMPORTANT**: Fish Lens is designed strictly for cybersecurity education, threat analysis, incident response triage, and defensive posture evaluation. Do not use this tool to interact with malicious command-and-control infrastructure without appropriate sandbox precautions. The software is provided "as is", without warranty of any kind.
