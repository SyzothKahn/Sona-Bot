// background.js
// Copies the hard-coded data from data.js into chrome.storage.local so
// every part of the extension (popup, settings page, and later the
// autofill content script) can read it the same way.

importScripts('data.js');

function loadDataIntoStorage() {
  chrome.storage.local.set({
    profile: JOBFILL_PROFILE,
    coverLetterTemplate: JOBFILL_COVER_LETTER_TEMPLATE,
    questionBank: JOBFILL_QUESTION_BANK
  });
}

// Runs once when the extension is first installed, and again any time
// Kevin reloads it after data.js changes.
chrome.runtime.onInstalled.addListener(loadDataIntoStorage);

// Also runs whenever Chrome starts up, just to be safe.
chrome.runtime.onStartup.addListener(loadDataIntoStorage);
