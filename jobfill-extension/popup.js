// popup.js

// ── Restore last scan on popup open ─────────────────────────────────────────
chrome.storage.local.get("lastScannedJob", ({ lastScannedJob }) => {
  if (!lastScannedJob) return;
  restoreScan(lastScannedJob);
});

function restoreScan(job) {
  setValue("scan-title",    job.title);
  setValue("scan-employer", job.employer);
  setValue("scan-location", job.location);

  const descEl = document.getElementById("scan-desc");
  if (job.description) {
    descEl.textContent = job.description;
    descEl.classList.remove("empty");
  }
  document.getElementById("scan-card").classList.add("visible");

  const fit = analyzeFit(job.description);
  if (fit) showFitVerdict(fit);

  document.getElementById("autofill-btn").style.display = "block";
  setStatus("Ready to fill", job.title || "Last scanned job loaded.");
}

// ── View Profile ────────────────────────────────────────────────────────────
document.getElementById("view-profile").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
});

// ── Scan Job Page ────────────────────────────────────────────────────────────
document.getElementById("scan-page").addEventListener("click", async () => {
  const btn = document.getElementById("scan-page");
  btn.textContent = "Scanning…";
  btn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content_scan.js"]
    });

    const job = results?.[0]?.result;
    if (!job) { showError("Could not read this page. Try opening a job posting first."); return; }

    await chrome.storage.local.set({ lastScannedJob: job });

    // Show scan results
    setValue("scan-title",    job.title);
    setValue("scan-employer", job.employer);
    setValue("scan-location", job.location);

    const descEl = document.getElementById("scan-desc");
    if (job.description) {
      descEl.textContent = job.description;
      descEl.classList.remove("empty");
    } else {
      descEl.textContent = "No description found.";
      descEl.classList.add("empty");
    }
    document.getElementById("scan-card").classList.add("visible");

    // Fit analysis
    const fit = analyzeFit(job.description);
    if (fit) showFitVerdict(fit);

    // Reveal autofill button
    document.getElementById("autofill-btn").style.display = "block";

    setStatus("Job scanned", job.title || "Scan complete — check results below.");

  } catch (err) {
    showError("Scan error: " + err.message);
  } finally {
    btn.textContent = "Scan Job Page";
    btn.disabled = false;
  }
});

// ── Autofill Form ────────────────────────────────────────────────────────────
document.getElementById("autofill-btn").addEventListener("click", async () => {
  const btn = document.getElementById("autofill-btn");
  btn.textContent = "Filling…";
  btn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const { profile } = await chrome.storage.local.get("profile");

    // Pass profile into the page, then run the autofill script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (p) => { window.__JOBFILL_PROFILE__ = p; },
      args: [profile]
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content_autofill.js"]
    });

    const summary = results?.[0]?.result;
    if (!summary) { showError("Autofill did not return a result."); return; }
    if (summary.error) { showError(summary.error); return; }

    showAutofillResults(summary);
    setStatus("Form filled", `${summary.filled?.length || 0} fields filled automatically.`);

  } catch (err) {
    showError("Autofill error: " + err.message);
  } finally {
    btn.textContent = "Autofill Form";
    btn.disabled = false;
  }
});

// ── Fit Analysis ─────────────────────────────────────────────────────────────
function analyzeFit(description) {
  if (!description) return null;
  const desc = description.toLowerCase();

  const hardGaps = [];
  const softGaps = [];

  const disqualifiers = [
    { terms: ["master's degree", "master's required", "master of science", "master of arts", "master of business", "m.s. required", "mba required", "m.b.a. required"], label: "Master's degree" },
    { terms: ["ph.d required", "ph.d.", "phd required", "doctorate required", "doctoral degree required"], label: "PhD / Doctorate" },
    { terms: [" r.n.", "registered nurse required", "nursing license required", "rn required"], label: "RN license" },
    { terms: ["lpn required", "l.p.n.", "licensed practical nurse required"], label: "LPN license" },
    { terms: [" cna required", "certified nursing assistant required"], label: "CNA certification" },
    { terms: [" cpa required", "cpa license", "certified public accountant required"], label: "CPA license" },
    { terms: ["pmp required", "pmp certification required", "project management professional required"], label: "PMP certification" },
    { terms: ["lcsw required", "licensed clinical social worker required"], label: "LCSW license" },
    { terms: ["lmft required", "licensed marriage and family therapist"], label: "LMFT license" },
    { terms: [" lpc required", "licensed professional counselor required"], label: "LPC license" },
    { terms: ["juris doctor", "law degree required", "bar exam required", "j.d. required"], label: "Law degree (JD)" },
    { terms: ["medical degree required", "m.d. required", "physician required"], label: "Medical degree (MD)" },
    { terms: ["cdl required", "commercial driver's license required", "class a license", "class b license"], label: "CDL license" },
    { terms: ["real estate license required", "broker license required"], label: "Real estate license" },
    { terms: ["professional engineer license", "p.e. required"], label: "PE license" },
    { terms: ["shrm-cp required", "shrm-scp required", "phr required", "sphr required"], label: "HR certification (SHRM/PHR)" },
  ];

  for (const dis of disqualifiers) {
    for (const term of dis.terms) {
      if (desc.includes(term)) {
        const idx     = desc.indexOf(term);
        const context = desc.slice(Math.max(0, idx - 200), idx + 200);
        if (isPreferred(context)) {
          softGaps.push(dis.label + " (preferred)");
        } else {
          hardGaps.push(dis.label);
        }
        break;
      }
    }
  }

  // Flag hard experience requirements above what Kevin has (~5 years)
  const expRe = /(\d+)\+?\s*(?:or more\s*)?years?\s+(?:of\s+)?(?:relevant\s+|related\s+|progressive\s+)?experience/gi;
  let m;
  while ((m = expRe.exec(desc)) !== null) {
    const years = parseInt(m[1]);
    if (years >= 7) {
      const context = desc.slice(Math.max(0, m.index - 200), m.index + 200);
      if (!isPreferred(context)) {
        hardGaps.push(`${years}+ years of experience required`);
      }
    }
  }

  const uniqueHard = [...new Set(hardGaps)];
  const uniqueSoft = [...new Set(softGaps)];

  let verdict, reason;
  if (uniqueHard.length === 0) {
    verdict = "apply";
    reason  = uniqueSoft.length > 0
      ? "Preferred (not required): " + uniqueSoft.join("; ")
      : "No disqualifying requirements found.";
  } else if (uniqueHard.length === 1) {
    verdict = "maybe";
    reason  = "Possible gap: " + uniqueHard[0];
    if (uniqueSoft.length > 0) reason += " · Preferred: " + uniqueSoft.join("; ");
  } else {
    verdict = "skip";
    reason  = "Missing: " + uniqueHard.slice(0, 3).join("; ");
    if (uniqueHard.length > 3) reason += ` (+${uniqueHard.length - 3} more)`;
  }

  return { verdict, reason };
}

function isPreferred(ctx) {
  return /prefer(?:red|ably)?|plus|bonus|nice[- ]to[- ]have|desired|ideal|advantage|helpful|a plus|strongly encouraged/i.test(ctx);
}

// ── Display helpers ───────────────────────────────────────────────────────────
function showFitVerdict(fit) {
  const card  = document.getElementById("fit-card");
  const label = document.getElementById("fit-label");
  const reason = document.getElementById("fit-reason");

  const map = {
    apply: { text: "✓ Apply",  cls: "fit-apply" },
    maybe: { text: "⚠ Maybe",  cls: "fit-maybe" },
    skip:  { text: "✕ Skip",   cls: "fit-skip"  },
  };
  const v = map[fit.verdict];
  card.className = "fit-card visible " + v.cls;
  label.textContent  = v.text;
  reason.textContent = fit.reason;
}

function showAutofillResults(summary) {
  const card      = document.getElementById("results-card");
  const filledDiv = document.getElementById("results-filled");
  const reviewDiv = document.getElementById("results-previewed");
  const reviewSec = document.getElementById("results-review");

  filledDiv.innerHTML = "";
  reviewDiv.innerHTML = "";

  const filled    = summary.filled    || [];
  const previewed = summary.previewed || [];
  const skipped   = summary.skipped   || [];

  if (filled.length === 0 && previewed.length === 0) {
    filledDiv.innerHTML = `<p class="results-item">No fillable fields found on this page.</p>`;
  } else {
    filled.forEach(f => {
      filledDiv.innerHTML += `<p class="results-item">✓ <span class="field-label">${esc(f.label)}:</span> ${esc(f.value)}</p>`;
    });
  }

  if (previewed.length > 0) {
    previewed.forEach(f => {
      reviewDiv.innerHTML += `<p class="results-item">· <span class="field-label">${esc(f.label)}:</span> ${esc(f.value)}</p>`;
    });
    reviewSec.style.display = "block";
  }

  if (skipped.length > 0) {
    filledDiv.innerHTML += `<p class="results-item" style="color:var(--ink-soft); margin-top:4px;">${skipped.length} field(s) skipped.</p>`;
  }

  card.classList.add("visible");
}

function setValue(id, text) {
  const el = document.getElementById(id);
  if (text && text.trim()) {
    el.textContent = text.trim();
    el.classList.remove("empty");
  } else {
    el.textContent = "Not found";
    el.classList.add("empty");
  }
}

function setStatus(title, detail) {
  document.querySelector(".status-title").textContent  = title;
  document.querySelector(".status-detail").textContent = detail;
}

function showError(msg) {
  setStatus("Error", msg);
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
