// content_autofill.js
// Injected after window.__JOBFILL_PROFILE__ has been set by popup.js.
// Fills form fields and returns { filled, previewed, skipped }.

(function () {
  const profile = window.__JOBFILL_PROFILE__;
  if (!profile) return { error: "Profile not loaded." };

  const p    = profile.personal;
  const d    = profile.demographics;
  const ex   = profile.experience;
  const ed   = profile.education;
  const refs = profile.references;

  const today     = new Date();
  const todayStr  = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

  // Each field: patterns matched against a normalized element key,
  // value to fill, confidence (high = fill now, medium = report for review),
  // optional avoid list (if any avoid term appears in key, skip this field).
  const FIELDS = [
    // --- Personal ---
    { patterns: ["first name", "firstname", "given name", "first_name", "legal first"],         value: "Kevin",                         conf: "high" },
    { patterns: ["last name", "lastname", "surname", "family name", "last_name", "legal last"],  value: "Barcelo",                       conf: "high" },
    { patterns: ["full name", "your name", "legal name", "applicant name"],
      avoid:    ["first", "last", "middle", "company", "employer", "school", "university", "manager", "supervisor", "reference"],
      value: "Kevin Barcelo",  conf: "high" },
    { patterns: ["email", "e-mail", "email address"],                                            value: p.email,                         conf: "high" },
    { patterns: ["phone", "telephone", "mobile", "cell", "contact number", "phone number"],     value: p.phone,                         conf: "high" },
    { patterns: ["city"],
      avoid:    ["employer", "company", "school", "university", "college"],
      value: "Chapel Hill",    conf: "high" },
    { patterns: ["state"],
      avoid:    ["employer", "company", "school", "university"],
      value: "North Carolina", conf: "high" },
    { patterns: ["country"],
      avoid:    ["employer", "company", "school"],
      value: "United States",  conf: "high" },
    { patterns: ["linkedin", "linked in", "linkedin url", "linkedin profile"],                   value: p.linkedin,                      conf: "high" },
    { patterns: ["website", "portfolio", "personal url"],
      avoid:    ["employer", "company"],
      value: p.linkedin,       conf: "high" },

    // --- Work authorization ---
    { patterns: ["authorized to work", "work authorization", "eligible to work", "legally authorized", "right to work"], value: "Yes", conf: "high" },
    { patterns: ["require sponsorship", "visa sponsorship", "need sponsorship", "sponsorship required", "work visa"],    value: "No",  conf: "high" },
    { patterns: ["willing to relocate", "open to relocation", "relocation"],                     value: "Yes",           conf: "high" },
    { patterns: ["start date", "available to start", "earliest start", "availability", "when can you start"],            value: "Immediately", conf: "high" },
    { patterns: ["employment type", "job type", "work type", "position type", "full.time", "part.time"],                 value: "Full-time",   conf: "high" },

    // --- Demographics (Kevin explicitly wants these filled) ---
    { patterns: ["gender", "sex"],
      avoid:    ["male", "female", "other", "decline"],
      value: "Male",           conf: "high" },
    { patterns: ["pronoun", "preferred pronoun"],                                                value: "He/Him",        conf: "high" },
    { patterns: ["hispanic", "latino", "hispanic or latino", "hispanic/latino"],                 value: "Yes",           conf: "high" },
    { patterns: ["race", "ethnicity", "race/ethnicity", "racial background"],
      avoid:    ["biracial"],
      value: "Latino / Hispanic / White", conf: "high" },
    { patterns: ["veteran", "military status", "veteran status", "protected veteran"],           value: "No",            conf: "high" },
    { patterns: ["disability", "disabled", "disability status"],                                 value: "No",            conf: "high" },
    { patterns: ["background check", "background screening", "consent to background", "criminal background"], value: "Yes", conf: "high" },
    { patterns: ["drug test", "drug screen", "substance test", "drug screening"],                value: "Yes",           conf: "high" },

    // --- Signature / date ---
    { patterns: ["signature", "sign here", "your signature", "electronic signature"],            value: "Kevin Barcelo", conf: "high" },
    { patterns: ["initials"],                                                                     value: "KB",            conf: "high" },
    { patterns: ["today", "signature date", "date signed"],                                      value: todayStr,        conf: "high" },

    // --- Most recent experience (medium — show for review) ---
    { patterns: ["current employer", "most recent employer", "previous employer", "last employer", "company name", "employer name", "organization name"],
      avoid:    ["school", "university", "college", "reference"],
      value: ex[0].employer,  conf: "medium" },
    { patterns: ["current title", "most recent title", "previous title", "last title", "job title", "position title", "position held"],
      avoid:    ["school", "degree", "education", "mr", "ms", "dr", "reference"],
      value: ex[0].title,     conf: "medium" },
    { patterns: ["start date", "from date", "employment start", "date started"],
      avoid:    ["school", "education", "available", "can you"],
      value: "11/2025",        conf: "medium" },
    { patterns: ["end date", "to date", "employment end", "date ended", "through date"],
      avoid:    ["school", "education"],
      value: "04/2026",        conf: "medium" },

    // --- Education (medium) ---
    { patterns: ["school", "university", "college name", "institution name", "name of school"],
      avoid:    ["high school diploma", "currently attending"],
      value: ed[0].school,    conf: "medium" },
    { patterns: ["degree type", "degree level", "level of education", "highest education", "highest degree"],
      value: "Bachelor of Arts", conf: "medium" },
    { patterns: ["major", "field of study", "concentration", "area of study", "degree field"],   value: "Psychology",    conf: "medium" },
    { patterns: ["graduation year", "year graduated", "grad year", "year of graduation"],        value: ed[0].year,      conf: "medium" },
    { patterns: ["gpa", "grade point"],                                                          value: "",              conf: "skip" },

    // --- References (medium) ---
    // Reference 1 — Saima Arina
    { patterns: ["reference 1 name", "ref 1 name", "first reference name", "reference1 name"],
      value: refs[0].name,         conf: "medium" },
    { patterns: ["reference 1 title", "ref 1 title", "reference1 title", "reference 1 position"],
      value: refs[0].title,        conf: "medium" },
    { patterns: ["reference 1 company", "ref 1 company", "reference1 company", "reference 1 organization", "reference 1 employer"],
      value: refs[0].company,      conf: "medium" },
    { patterns: ["reference 1 email", "ref 1 email", "reference1 email"],
      value: refs[0].email,        conf: "medium" },
    { patterns: ["reference 1 phone", "ref 1 phone", "reference1 phone"],
      value: refs[0].phone,        conf: "medium" },
    { patterns: ["reference 1 relationship", "ref 1 relationship", "reference1 relationship"],
      value: refs[0].relationship, conf: "medium" },

    // Reference 2 — Laura Torres
    { patterns: ["reference 2 name", "ref 2 name", "second reference name", "reference2 name"],
      value: refs[1].name,         conf: "medium" },
    { patterns: ["reference 2 title", "ref 2 title", "reference2 title"],
      value: refs[1].title,        conf: "medium" },
    { patterns: ["reference 2 company", "ref 2 company", "reference2 company", "reference 2 organization", "reference 2 employer"],
      value: refs[1].company,      conf: "medium" },
    { patterns: ["reference 2 email", "ref 2 email", "reference2 email"],
      value: refs[1].email,        conf: "medium" },
    { patterns: ["reference 2 phone", "ref 2 phone", "reference2 phone"],
      value: refs[1].phone,        conf: "medium" },
    { patterns: ["reference 2 relationship", "ref 2 relationship", "reference2 relationship"],
      value: refs[1].relationship, conf: "medium" },

    // Reference 3 — Christine Turnbull
    { patterns: ["reference 3 name", "ref 3 name", "third reference name", "reference3 name"],
      value: refs[2].name,         conf: "medium" },
    { patterns: ["reference 3 title", "ref 3 title", "reference3 title"],
      value: refs[2].title,        conf: "medium" },
    { patterns: ["reference 3 company", "ref 3 company", "reference3 company", "reference 3 organization", "reference 3 employer"],
      value: refs[2].company,      conf: "medium" },
    { patterns: ["reference 3 email", "ref 3 email", "reference3 email"],
      value: refs[2].email,        conf: "medium" },
    { patterns: ["reference 3 phone", "ref 3 phone", "reference3 phone"],
      value: refs[2].phone,        conf: "medium" },
    { patterns: ["reference 3 relationship", "ref 3 relationship", "reference3 relationship"],
      value: refs[2].relationship, conf: "medium" },

    // Generic reference fields (single-reference forms or unlabeled fields)
    // These match when there's no number prefix — fills with first reference
    { patterns: ["contact person", "contact name", "reference name", "name of reference"],
      avoid:    ["emergency", "your name", "full name", "applicant"],
      value: refs[0].name,         conf: "medium" },
    { patterns: ["contact title", "reference title", "reference job title", "title of reference"],
      avoid:    ["your title", "job title", "position title"],
      value: refs[0].title,        conf: "medium" },
    { patterns: ["reference company", "reference employer", "reference organization", "company of reference"],
      avoid:    ["your company", "current employer"],
      value: refs[0].company,      conf: "medium" },
    { patterns: ["relationship to contact", "relationship to reference", "your relationship", "how do you know", "nature of relationship"],
      avoid:    ["marital", "family"],
      value: refs[0].relationship, conf: "medium" },
    { patterns: ["reference email", "contact email"],
      avoid:    ["your email", "applicant email"],
      value: refs[0].email,        conf: "medium" },
    { patterns: ["reference phone", "contact phone", "reference telephone"],
      avoid:    ["your phone", "applicant phone"],
      value: refs[0].phone,        conf: "medium" },
    { patterns: ["years known", "how long have you known", "how many years have you known", "length of acquaintance", "years acquainted"],
      value: refs[0].yearsKnown,   conf: "medium" },
    { patterns: ["may we contact", "okay to contact", "can we contact", "permission to contact", "contact this reference", "is it okay to contact"],
      value: "Yes",                conf: "high" },
  ];

  const filled    = [];
  const previewed = [];
  const skipped   = [];

  // Collect all visible, enabled form elements (skip file/submit/hidden)
  const elements = [...document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"]),' +
    'select, textarea'
  )].filter(el => !el.disabled && !el.readOnly && isVisible(el));

  // Group radio buttons by name so we only report each group once
  const filledRadioGroups = new Set();

  for (const el of elements) {
    const key = getElementKey(el);

    // SSN guard — never touch
    if (/\bssn\b|social.?security|social.?sec\b/.test(key)) continue;

    // Skip textareas — Phase 5 (question bank)
    if (el.tagName.toLowerCase() === "textarea") continue;

    const field = findField(key, FIELDS);
    if (!field || field.conf === "skip") continue;

    const inputType = (el.getAttribute("type") || "text").toLowerCase();

    try {
      if (el.tagName.toLowerCase() === "select") {
        const chosen = fillSelect(el, field.value);
        if (chosen) {
          record(field.conf, getLabel(el) || key, chosen, filled, previewed);
        } else {
          skipped.push({ label: getLabel(el) || key, reason: `No option matching "${field.value}"` });
        }

      } else if (inputType === "radio") {
        const groupName = el.name || key;
        if (filledRadioGroups.has(groupName)) continue;
        const desired = field.value.toLowerCase();
        const radioVal = (el.value || "").toLowerCase();
        const radioLbl = getLabel(el).toLowerCase();
        const match =
          radioVal === desired ||
          radioLbl === desired ||
          (desired === "yes" && /^(yes|true|1|y|i do|agree)$/.test(radioVal)) ||
          (desired === "no"  && /^(no|false|0|n|i do not|disagree)$/.test(radioVal));
        if (match) {
          el.checked = true;
          triggerChange(el);
          filledRadioGroups.add(groupName);
          record(field.conf, getLabel(el) || groupName, field.value, filled, previewed);
        }

      } else if (inputType === "checkbox") {
        const desired = /^(yes|true|1|agree|authorized|i agree|i consent)$/i.test(field.value);
        el.checked = desired;
        triggerChange(el);
        record(field.conf, getLabel(el) || key, desired ? "checked" : "unchecked", filled, previewed);

      } else {
        // Text / number / date / email / tel
        if (!field.value) continue;
        fillText(el, field.value);
        record(field.conf, getLabel(el) || key, field.value, filled, previewed);
      }
    } catch (e) {
      skipped.push({ label: getLabel(el) || key, reason: e.message });
    }
  }

  return { filled, previewed, skipped };

  // ── Helpers ────────────────────────────────────────────────────────────────

  function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function getElementKey(el) {
    const parts = [
      el.name        || "",
      el.id          || "",
      el.placeholder || "",
      el.getAttribute("aria-label")       || "",
      el.getAttribute("aria-labelledby")
        ? (document.getElementById(el.getAttribute("aria-labelledby"))?.innerText || "")
        : "",
      getLabel(el),
    ];
    return parts.join(" ").toLowerCase().replace(/[_\-]/g, " ").replace(/\s+/g, " ").trim();
  }

  function getLabel(el) {
    if (el.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl) return lbl.innerText.trim();
    }
    const wrapped = el.closest("label");
    if (wrapped) return wrapped.innerText.replace(el.value || "", "").trim();
    const prev = el.previousElementSibling;
    if (prev && ["LABEL", "SPAN", "DIV", "P", "LI"].includes(prev.tagName)) {
      return prev.innerText.trim();
    }
    return el.name || el.placeholder || "";
  }

  function findField(key, fields) {
    for (const f of fields) {
      if (f.avoid && f.avoid.some(a => key.includes(a))) continue;
      if (f.patterns.some(p => key.includes(p))) return f;
    }
    return null;
  }

  function fillSelect(el, value) {
    const val = value.toLowerCase();
    let best = null, bestScore = 0;
    for (const opt of el.options) {
      if (opt.disabled) continue;
      const optText = (opt.text  || "").toLowerCase().trim();
      const optVal  = (opt.value || "").toLowerCase().trim();
      if (optText === val || optVal === val) { best = opt; break; }
      if (optText.includes(val) || val.includes(optText)) {
        const score = optText.length;
        if (score > bestScore) { best = opt; bestScore = score; }
      }
    }
    if (best) {
      el.value = best.value;
      triggerChange(el);
      return best.text;
    }
    return null;
  }

  function fillText(el, value) {
    el.focus();
    // React-friendly: set via native input value setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, "value"
    )?.set;
    if (nativeInputValueSetter && el.tagName === "INPUT") {
      nativeInputValueSetter.call(el, value);
    } else {
      el.value = value;
    }
    triggerChange(el);
    el.blur();
  }

  function triggerChange(el) {
    el.dispatchEvent(new Event("input",  { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function record(conf, label, value, filled, previewed) {
    if (conf === "high") {
      filled.push({ label, value });
    } else {
      previewed.push({ label, value });
    }
  }
})();
