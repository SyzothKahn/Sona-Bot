// settings.js
// Reads the profile, cover letter template, and question bank from
// chrome.storage.local (put there by background.js) and renders them.

function row(label, value) {
  return `<dt>${label}</dt><dd>${value}</dd>`;
}

function renderPersonalCard(p) {
  return `
    <div class="card">
      <h2>Personal Info</h2>
      <dl class="kv-grid">
        ${row("Name", p.fullName)}
        ${row("Location", p.location)}
        ${row("Phone", p.phone)}
        ${row("Email", p.email)}
        ${row("LinkedIn", `<a href="${p.linkedin}" target="_blank">${p.linkedin}</a>`)}
        ${row("Work authorization", p.workAuthorization)}
        ${row("Needs sponsorship", p.sponsorshipRequired)}
        ${row("Earliest start date", p.earliestStartDate)}
        ${row("Willing to relocate", p.willingToRelocate)}
        ${row("Preferred work type", p.preferredWorkType)}
      </dl>
    </div>`;
}

function renderDemographicsCard(d) {
  return `
    <div class="card">
      <h2>Demographic Defaults</h2>
      <dl class="kv-grid">
        ${row("Gender", d.gender)}
        ${row("Pronouns", d.pronouns)}
        ${row("Hispanic/Latino", d.hispanicLatino)}
        ${row("Race/Ethnicity", d.raceEthnicity)}
        ${row("Veteran status", d.veteranStatus)}
        ${row("Disability status", d.disabilityStatus)}
        ${row("Driver's license", d.driversLicense)}
        ${row("Background check OK", d.backgroundCheck)}
        ${row("Drug screening OK", d.drugScreening)}
        ${row("Signature", `${d.signatureName} (${d.signatureInitials})`)}
      </dl>
    </div>`;
}

function renderSummaryCard(summary) {
  return `
    <div class="card">
      <h2>Professional Summary</h2>
      <p class="summary-text">${summary}</p>
    </div>`;
}

function renderExperienceCard(jobs) {
  const jobsHtml = jobs.map(job => `
    <div class="job">
      <p class="job-title">${job.title} &mdash; ${job.employer}</p>
      <p class="job-meta">${job.location} &middot; ${job.dates}</p>
      <ul>
        ${job.bullets.map(b => `<li>${b}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  return `
    <div class="card">
      <h2>Experience</h2>
      ${jobsHtml}
    </div>`;
}

function renderEducationCard(education) {
  const eduHtml = education.map(e => `
    <div class="edu-entry">
      <div class="edu-degree">${e.degree}</div>
      <div class="edu-meta">${e.school} &middot; ${e.year}</div>
      <div class="edu-meta">${e.note}</div>
    </div>
  `).join("");

  return `
    <div class="card">
      <h2>Education</h2>
      ${eduHtml}
    </div>`;
}

function renderTagCard(title, items) {
  return `
    <div class="card">
      <h2>${title}</h2>
      <div class="tag-list">
        ${items.map(i => `<span class="tag">${i}</span>`).join("")}
      </div>
    </div>`;
}

function renderCoverLetterCard(template) {
  return `
    <div class="card">
      <h2>Cover Letter Template</h2>
      <pre class="cover-letter">${template}</pre>
    </div>`;
}

function renderQuestionBankCard(bank) {
  const entries = bank.map(qa => `
    <div class="qa-entry">
      <p class="qa-question">${qa.question}</p>
      <p class="qa-answer">${qa.answer}</p>
    </div>
  `).join("");

  return `
    <div class="card">
      <h2>Saved Answers (${bank.length})</h2>
      ${entries}
    </div>`;
}

chrome.storage.local.get(["profile", "coverLetterTemplate", "questionBank"], (data) => {
  const { profile, coverLetterTemplate, questionBank } = data;
  const content = document.getElementById("content");

  if (!profile) {
    content.innerHTML = `<p class="loading">No profile found yet. Try reloading the extension from chrome://extensions.</p>`;
    return;
  }

  content.innerHTML = [
    renderPersonalCard(profile.personal),
    renderDemographicsCard(profile.demographics),
    renderSummaryCard(profile.summary),
    renderExperienceCard(profile.experience),
    renderEducationCard(profile.education),
    renderTagCard("Certifications", profile.certifications),
    renderTagCard("Languages", profile.languages),
    renderTagCard("Skills", profile.skills),
    renderCoverLetterCard(coverLetterTemplate),
    renderQuestionBankCard(questionBank)
  ].join("");
});
