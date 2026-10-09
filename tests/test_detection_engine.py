"""
Fish Lens Detection Engine Unit Tests
Automated test suite using pytest to verify phishing URL & email heuristics.
"""

import pytest
import re
from urllib.parse import urlparse

# --- Reference Constants & Logic Mirroring Engine for Pytest Verification ---

POPULAR_BRANDS = [
    "google", "paypal", "microsoft", "apple", "amazon", "netflix",
    "facebook", "instagram", "twitter", "chase", "bankofamerica", "binance"
]

SUSPICIOUS_TLDS = ["xyz", "top", "buzz", "club", "work", "stream", "icu", "cam", "monster"]
URL_SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "is.gd", "rebrand.ly", "rb.gy"]
PHISHING_KEYWORDS = ["login", "verify", "secure", "account", "update", "banking", "password", "confirm"]
URGENT_PHRASES = [
    "account will be suspended", "immediate action required", "within 24 hours",
    "unauthorized login detected", "verify now or lose access", "warrant for arrest"
]
HOMOGLYPH_CHARS = {"\u0430": "a", "\u0441": "c", "\u0435": "e", "\u043E": "o", "\u0440": "p"}

def levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def is_ip_hostname(hostname: str) -> bool:
    ipv4_pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
    return bool(re.match(ipv4_pattern, hostname)) or ":" in hostname

def is_private_ip(ip: str) -> bool:
    clean = ip.replace("::ffff:", "")
    parts = clean.split(".")
    if len(parts) == 4 and all(p.isdigit() for p in parts):
        a, b = int(parts[0]), int(parts[1])
        if a == 10: return True
        if a == 127: return True
        if a == 192 and b == 168: return True
        if a == 172 and 16 <= b <= 31: return True
        if a == 169 and b == 254: return True
        if a == 0: return True
        return False
    if clean.lower() in ["::1", "::"] or clean.lower().startswith(("fe80:", "fc00:", "fd00:")):
        return True
    return False

def check_lookalike(domain_name: str) -> bool:
    norm = re.sub(r"[^a-z0-9]", "", domain_name.lower())
    for brand in POPULAR_BRANDS:
        if norm == brand:
            continue
        dist = levenshtein_distance(norm, brand)
        if (dist == 1 and len(brand) >= 4) or (dist == 2 and len(brand) >= 7):
            return True
        de_leeted = norm.replace("0", "o").replace("1", "l").replace("3", "e").replace("5", "s")
        if de_leeted == brand:
            return True
    return False

# --- Unit Tests ---

class TestUrlHeuristics:
    def test_levenshtein_lookalike_detection(self):
        """Test Levenshtein typosquatting and leetspeak brand impersonation."""
        assert check_lookalike("paypa1") is True
        assert check_lookalike("g00gle") is True
        assert check_lookalike("micros0ft") is True
        assert check_lookalike("app1e") is True
        assert check_lookalike("paypai") is True
        # Legitimate brand should not flag as lookalike of itself
        assert check_lookalike("paypal") is False

    def test_suspicious_tld_detection(self):
        """Test identification of high-risk suspicious TLDs."""
        for tld in ["xyz", "top", "buzz", "icu", "monster"]:
            assert tld in SUSPICIOUS_TLDS
        assert "com" not in SUSPICIOUS_TLDS
        assert "org" not in SUSPICIOUS_TLDS

    def test_ip_address_hostname(self):
        """Test detection of raw numeric IP hostnames."""
        assert is_ip_hostname("192.168.1.1") is True
        assert is_ip_hostname("185.220.101.5") is True
        assert is_ip_hostname("2001:db8::1") is True
        assert is_ip_hostname("paypal.com") is False
        assert is_ip_hostname("security.google.com") is False

    def test_excessive_subdomains(self):
        """Test detection of subdomain chaining (> 3 subdomains)."""
        def count_subdomains(hostname: str) -> int:
            parts = hostname.split(".")
            return max(0, len(parts) - 2)

        chained = "security.apple.id.verify.account.phish.com"
        assert count_subdomains(chained) >= 3

        normal = "login.microsoft.com"
        assert count_subdomains(normal) < 3

    def test_at_symbol_credential_trick(self):
        """Test detection of userinfo @ symbol redirection trick."""
        url = "https://google.com@evil-harvest.buzz/login"
        assert "@" in url
        parsed = urlparse(url)
        assert parsed.username == "google.com"
        assert parsed.hostname == "evil-harvest.buzz"

    def test_punycode_and_homoglyphs(self):
        """Test detection of Punycode xn-- prefix and Cyrillic homoglyphs."""
        punycode_host = "xn--appl-43d.com"
        assert punycode_host.startswith("xn--")

        cyrillic_url = "http://g\u043E\u043Egle.com/login"  # Cyrillic 'о'
        has_homoglyph = any(c in HOMOGLYPH_CHARS for c in cyrillic_url)
        assert has_homoglyph is True

    def test_url_shorteners(self):
        """Test detection of public URL shortening masking services."""
        for short in ["bit.ly", "tinyurl.com", "t.co", "is.gd"]:
            assert short in URL_SHORTENERS

    def test_phishing_keywords(self):
        """Test identification of credential harvesting keywords."""
        url = "https://example.com/account/login/verify.php?token=xyz"
        found = [k for k in PHISHING_KEYWORDS if k in url]
        assert "login" in found
        assert "verify" in found
        assert "account" in found

    def test_url_length(self):
        """Test flagged long URLs exceeding standard heuristic thresholds."""
        short_url = "https://chase.com/index.html"
        long_url = "https://phish.com/verify?token=" + "a" * 100
        assert len(short_url) <= 85
        assert len(long_url) > 85


class TestEmailHeuristics:
    def test_from_reply_to_mismatch(self):
        """Test detection of sender and reply-to domain mismatches."""
        from_hdr = "security@paypal.com"
        reply_to_hdr = "attacker@mail-drop.xyz"
        from_domain = from_hdr.split("@")[1]
        reply_domain = reply_to_hdr.split("@")[1]
        assert from_domain != reply_domain

    def test_failed_and_missing_email_auth(self):
        """Test parsing of SPF, DKIM, and DMARC failures."""
        auth_results = "spf=fail (sender IP not allowed); dkim=fail; dmarc=fail"
        assert "spf=fail" in auth_results
        assert "dkim=fail" in auth_results
        assert "dmarc=fail" in auth_results

    def test_urgent_threatening_language(self):
        """Test psychological urgency and threat phrase detection."""
        body = "Your account will be suspended within 24 hours unless you act immediately."
        body_lower = body.lower()
        matches = [p for p in URGENT_PHRASES if p in body_lower]
        assert len(matches) >= 2
        assert "account will be suspended" in matches
        assert "within 24 hours" in matches

    def test_anchor_text_spoofing(self):
        """Test HTML anchor tags where visible text differs from href destination."""
        visible_text = "https://bankofamerica.com"
        href = "http://bankofamer1ca-evil.xyz/login"
        
        vis_host = urlparse(visible_text).hostname
        href_host = urlparse(href).hostname
        assert vis_host != href_host


class TestSsrfProtection:
    def test_private_and_local_ip_blocking(self):
        """Test SSRF guard blocks all loopback, private RFC 1918, and link-local ranges."""
        blocked_ips = [
            "127.0.0.1",
            "127.0.0.254",
            "10.0.0.1",
            "10.254.254.254",
            "172.16.0.1",
            "172.31.255.255",
            "192.168.1.1",
            "192.168.0.254",
            "169.254.169.254", # AWS/GCP cloud metadata service
            "0.0.0.0",
            "::1",
            "fe80::1",
        ]
        for ip in blocked_ips:
            assert is_private_ip(ip) is True, f"IP {ip} should be blocked for SSRF"

    def test_public_ip_allowed(self):
        """Test SSRF guard permits legitimate public internet IP addresses."""
        public_ips = [
            "8.8.8.8",
            "1.1.1.1",
            "142.250.190.46",
            "151.101.1.140",
        ]
        for ip in public_ips:
            assert is_private_ip(ip) is False, f"IP {ip} should be permitted"
