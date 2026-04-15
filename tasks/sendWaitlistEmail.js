/**
 * Makan Waitlist → Resend automation
 * Redmine: https://redmine.jawasoft.com/issues/17794
 *
 * Functions:
 *   - sendWaitlistEmail    : main blast + going-forward send
 *   - diagnoseTemplate     : probe Resend API to debug auth/template issues
 *   - resetStatusColumns   : wipe columns E and F (no sheet edit events fired)
 *   - markTestRowsAsSkip   : tag rows with obvious test emails so they skip
 */

const TEMPLATE_ID = "youre-in";
const FROM_ADDRESS = "Makan <hello@makanofficial.com>";
const SHEET_NAME = "Sheet1";

const TEST_MODE = true;
const TEST_EMAIL = "devonrrmakepeace@gmail.com";

const SEND_DELAY_MS = 250;

/**
 * Main blast + going-forward automation.
 * Scans the sheet, sends the template to any row with empty column E.
 */
function sendWaitlistEmail() {
  const apiKey = PropertiesService.getScriptProperties().getProperty("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY missing. Set it in Project Settings → Script Properties.");
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("Sheet tab '" + SHEET_NAME + "' not found.");

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    console.log("No data rows.");
    return;
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    console.log("Another run is already in progress — skipping.");
    return;
  }

  try {
    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (let row = 2; row <= lastRow; row++) {
      const email  = String(sheet.getRange(row, 3).getValue()).trim();
      const status = String(sheet.getRange(row, 5).getValue()).trim();

      if (!email) { skipped++; continue; }
      if (status) { skipped++; continue; }

      const name     = String(sheet.getRange(row, 2).getValue()).trim();
      const location = String(sheet.getRange(row, 4).getValue()).trim();
      const targetEmail = TEST_MODE ? TEST_EMAIL : email;

      const payload = {
        from: FROM_ADDRESS,
        to: [targetEmail],
        template: {
          id: TEMPLATE_ID,
          variables: {
            name: name || "friend",
            location: location || ""
          }
        }
      };

      const response = UrlFetchApp.fetch("https://api.resend.com/emails", {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: "Bearer " + apiKey },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const code = response.getResponseCode();
      const body = response.getContentText();

      if (code >= 200 && code < 300) {
        const label = TEST_MODE ? ("Sent (TEST -> " + TEST_EMAIL + ")") : "Sent";
        sheet.getRange(row, 5).setValue(label);
        sheet.getRange(row, 6).setValue(new Date());
        sent++;
        console.log("Row " + row + ": sent to " + targetEmail);
      } else {
        sheet.getRange(row, 5).setValue("Error " + code);
        sheet.getRange(row, 6).setValue(new Date());
        errors++;
        console.error("Row " + row + ": Resend " + code + " — " + body);
      }

      Utilities.sleep(SEND_DELAY_MS);
    }

    console.log("Done. Sent: " + sent + ". Skipped: " + skipped + ". Errors: " + errors + ".");
  } finally {
    lock.releaseLock();
  }
}

/**
 * Run this to diagnose 404/401 errors. Does not send emails.
 */
function diagnoseTemplate() {
  const apiKey = PropertiesService.getScriptProperties().getProperty("RESEND_API_KEY");
  if (!apiKey) {
    console.error("RESEND_API_KEY missing in Script Properties.");
    return;
  }

  const headers = { Authorization: "Bearer " + apiKey };
  const opts = { method: "get", headers: headers, muteHttpExceptions: true };

  const domains = UrlFetchApp.fetch("https://api.resend.com/domains", opts);
  console.log("1. Domains (" + domains.getResponseCode() + "): " + domains.getContentText());

  const tmplBySlug = UrlFetchApp.fetch("https://api.resend.com/templates/youre-in", opts);
  console.log("2. Template by slug 'youre-in' (" + tmplBySlug.getResponseCode() + "): " + tmplBySlug.getContentText());

  const tmplByUuid = UrlFetchApp.fetch("https://api.resend.com/templates/4037d663-9cc3-4074-9475-910ccdff79aa", opts);
  console.log("3. Template by UUID (" + tmplByUuid.getResponseCode() + "): " + tmplByUuid.getContentText());

  const list = UrlFetchApp.fetch("https://api.resend.com/templates", opts);
  console.log("4. All templates (" + list.getResponseCode() + "): " + list.getContentText());
}

/**
 * Utility: reset column E and F from row 2 onward.
 * Safe to run even if an onChange trigger is installed — uses clearContent
 * which does not fire sheet edit events.
 */
function resetStatusColumns() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  sheet.getRange(2, 5, lastRow - 1, 2).clearContent();
  console.log("Cleared E2:F" + lastRow);
}

/**
 * Tag obvious test rows so sendWaitlistEmail skips them.
 * Run after resetStatusColumns and before flipping TEST_MODE = false.
 */
function markTestRowsAsSkip() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  const markers = ["test@", "test.dev", "claude.dev"]; // substrings that flag a test row
  let marked = 0;
  for (let row = 2; row <= lastRow; row++) {
    const email = String(sheet.getRange(row, 3).getValue()).trim().toLowerCase();
    if (!email) continue;
    if (markers.some(function (m) { return email.indexOf(m) !== -1; })) {
      sheet.getRange(row, 5).setValue("Skip - test data");
      marked++;
    }
  }
  console.log("Marked " + marked + " test rows as Skip");
}
