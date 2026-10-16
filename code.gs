/** Animal Health Certificate – Google Apps Script backend */
/** Paste the ID of your Google Sheet: the long text between /d/ and /edit in its URL */
var SPREADSHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID_HERE';
var SHEET_NAME = 'Certificates';  // tab name; created automatically if missing

var HEADERS = ['Sl.No','Timestamp','Institution','Owner','Farmer ID (Fruits)','Category','Address','Occupation',
  'Row','Animal','Tag No','Breed/ND','Sex','Colour & marks','Age','Height','Horn','Value (Rs)',
  'Source of supply','No. of calving','Last calving','Milk yield (L/day)','Peak yield (L/day)',
  'Q10 Sound health','Q11 Contagious disease','Q12 Well cared','Q13 Protected / last vaccination',
  'Q14 Four quarters','Q15 Fit for breeding','Q16 Risk normal','Q17 Accept risk',
  'Veterinarian','Designation','Qualification','KVC No','Place','Date'];

function doGet() {
  return json_({ ok: true, message: 'Animal Health Certificate API is running' });
}

function doPost(e) {
  try {
    var res = saveCertificate(JSON.parse(e.postData.contents));
    return json_({ ok: true, slno: res.slno });
  } catch (err) {
    return json_({ ok: false, error: err.message });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Saves one certificate; each animal row becomes one sheet row sharing the same Sl.No */
function saveCertificate(d) {
  if (!d || !d.name || !d.animals || !d.animals.length) throw new Error('Owner name and at least one animal are required.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = getSheet_();
    var now = new Date();

    var rows = d.animals.map(function (a, i) {
      return [d.slno, now, d.institution, d.name, d.fruits, d.category, d.address, d.occupation,
        rowLabel_(i), a.animal, a.tag, a.breed, a.sex, a.character, a.age, a.height, a.horn, a.value,
        d.source, a.noofcalving, a.dateoflastcalving, a.milkyield, a.peakmilkyield,
        d.q10, d.q11, d.q12, d.q13, d.q14, d.q15, d.q16, d.q17,
        d.dr, d.designation, d.qualification, d.kvc, d.place, d.today];
    });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
    return { slno: d.slno };
  } finally {
    lock.releaseLock();
  }
}

/** a..z, aa, ab, ... */
function rowLabel_(i) {
  var s = ''; i++;
  while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(97 + m) + s; i = Math.floor((i - 1) / 26); }
  return s;
}
