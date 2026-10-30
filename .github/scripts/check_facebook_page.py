#!/usr/bin/env python3
"""Read-only diagnostic for the SKY TruFiber public Facebook Page.

This deliberately does not sign in, use cookies, bypass controls, or write to Supabase.
It records whether Facebook returns public page HTML and whether obvious post
permalinks/IDs are present. A successful HTTP response is not proof that the
returned HTML is a complete or reliable feed.
"""
import json
import os
import re
import sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

PAGE_URL = "https://www.facebook.com/p/SKY-TruFiber-by-AHBA-Development-61579845245888/"
OUTPUT = "facebook-page-check.json"

class MetaParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
        self.links = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta" and a.get("property") in ("og:title", "og:description", "og:url"):
            self.meta[a["property"]] = a.get("content", "")
        if tag == "a" and a.get("href"):
            self.links.append(a["href"])

def main():
    report = {
        "checked_at_utc": datetime.now(timezone.utc).isoformat(),
        "page_url": PAGE_URL,
        "http_status": None,
        "final_url": None,
        "content_type": None,
        "page_title": None,
        "og_title": None,
        "login_or_checkpoint_detected": False,
        "candidate_post_links": [],
        "candidate_post_ids": [],
        "feed_accessible": False,
        "note": "Diagnostic only. Candidate links are not a verified complete feed."
    }
    req = Request(PAGE_URL, headers={
        "User-Agent": "Mozilla/5.0 (compatible; ShadowHunterPageCheck/1.0)",
        "Accept": "text/html,application/xhtml+xml"
    })
    try:
        with urlopen(req, timeout=25) as response:
            body = response.read(5_000_000).decode("utf-8", "replace")
            report["http_status"] = response.status
            report["final_url"] = response.geturl()
            report["content_type"] = response.headers.get("Content-Type")
    except HTTPError as exc:
        report["http_status"] = exc.code
        report["final_url"] = exc.geturl()
        body = exc.read(1_000_000).decode("utf-8", "replace")
    except (URLError, TimeoutError, OSError) as exc:
        report["error"] = str(exc)
        body = ""

    if body:
        parser = MetaParser()
        parser.feed(body)
        report["og_title"] = parser.meta.get("og:title")
        title = re.search(r"<title[^>]*>(.*?)</title>", body, re.I | re.S)
        if title:
            report["page_title"] = re.sub(r"\s+", " ", title.group(1))[:250]
        lower = body.lower()
        report["login_or_checkpoint_detected"] = any(
            marker in lower for marker in (
                "login_form", "login/?", "checkpoint", "you must log in",
                "content isn't available right now"
            )
        )
        links = []
        ids = set()
        for href in parser.links:
            decoded = href.replace("&amp;", "&")
            if any(part in decoded for part in ("/posts/", "story_fbid=", "pfbid", "/photos/")):
                if decoded.startswith("/"):
                    decoded = "https://www.facebook.com" + decoded
                if decoded not in links:
                    links.append(decoded)
            for match in re.findall(r"(?:story_fbid=|pfbid)([A-Za-z0-9_-]+)", decoded):
                ids.add(match)
        report["candidate_post_links"] = links[:30]
        report["candidate_post_ids"] = sorted(ids)[:30]
        report["feed_accessible"] = bool(
            report["http_status"] == 200 and links and not report["login_or_checkpoint_detected"]
        )

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    # A blocked/incomplete page is a diagnostic outcome, not a workflow crash.
    if report.get("http_status") is None:
        sys.exit(1)

if __name__ == "__main__":
    main()
