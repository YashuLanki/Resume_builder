// Resume Builder analytics collector.
// Bind this script to a Google Sheet (Extensions -> Apps Script), then
// Deploy -> New deployment -> Web app -> Execute as: Me, Access: Anyone.
const SHEET_NAME = 'events';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['receivedAt', 'timestamp', 'event', 'sessionId', 'deviceType',
                       'browser', 'language', 'success', 'timeSpentSeconds', 'step', 'mode', 'userAgent']);
    }
    const d = JSON.parse(e.postData.contents);
    sheet.appendRow([new Date(), d.timestamp || '', d.event || '', d.sessionId || '',
                     d.deviceType || '', d.browser || '', d.language || '',
                     d.success === undefined ? '' : d.success, d.timeSpentSeconds || '',
                     d.step || '', d.mode || '', d.userAgent || '']);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
