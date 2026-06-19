// content_scan.js
// Injected into the active tab when Kevin clicks "Scan Job Page".
// Returns job title, employer, location, and description.

(function () {

  function getMeta(name) {
    const el =
      document.querySelector(`meta[property="${name}"]`) ||
      document.querySelector(`meta[name="${name}"]`);
    return el ? el.content.trim() : "";
  }

  function getJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item["@type"] === "JobPosting") return item;
        }
      } catch (_) {}
    }
    return null;
  }

  // Decode HTML entities and strip tags (fixes &lt;li&gt; etc.)
  function decodeHtml(html) {
    if (!html) return "";
    const el = document.createElement("div");
    el.innerHTML = html;
    return el.innerText;
  }

  function truncate(text, maxChars) {
    if (!text) return "";
    const clean = text.replace(/\s+/g, " ").trim();
    return clean.length > maxChars ? clean.slice(0, maxChars) + "…" : clean;
  }

  const ld = getJsonLd();

  // --- Job Title ---
  let title =
    (ld && ld.title) ||
    getMeta("og:title") ||
    document.querySelector("h1")?.innerText ||
    document.title ||
    "";
  title = title
    .replace(/\s*[\|\-–]\s*(LinkedIn|Indeed|Glassdoor|ZipRecruiter|Handshake|Monster|CareerBuilder|Greenhouse|Lever|Workday|Job Board).*$/i, "")
    .trim();

  // --- Employer ---
  let employer =
    (ld && (ld.hiringOrganization?.name || (typeof ld.hiringOrganization === "string" ? ld.hiringOrganization : ""))) ||
    getMeta("og:site_name") ||
    "";
  if (!employer) {
    const el = document.querySelector(
      '[data-testid="employer-name"], [class*="company-name"], [class*="employer-name"], [class*="organization-name"]'
    );
    employer = el ? el.innerText.trim() : "";
  }

  // --- Location ---
  let location = "";
  if (ld && ld.jobLocation) {
    const loc = Array.isArray(ld.jobLocation) ? ld.jobLocation[0] : ld.jobLocation;
    if (typeof loc === "string") {
      location = loc;
    } else if (loc?.address) {
      const a = loc.address;
      location = [a.addressLocality, a.addressRegion, a.addressCountry]
        .filter(Boolean).join(", ");
    }
  }
  if (!location) location = getMeta("og:locality");
  if (!location) {
    const el = document.querySelector(
      '[data-testid="job-location"], [class*="job-location"], [class*="location"]'
    );
    location = el ? el.innerText.trim() : "";
  }

  // --- Description ---
  let description = "";
  if (ld && ld.description) {
    description = decodeHtml(ld.description);
  }
  if (!description) {
    description = getMeta("og:description") || getMeta("description") || "";
  }
  if (!description) {
    const el = document.querySelector(
      '[class*="description"], [class*="job-details"], [id*="description"], article, main'
    );
    description = el ? el.innerText : "";
  }

  return {
    title:       title.slice(0, 200),
    employer:    employer.slice(0, 200),
    location:    location.slice(0, 200),
    description: truncate(description, 5000),
    url:         window.location.href
  };
})();
