/* Paste your deployed Apps Script Web App URL (ends with /exec) here */
var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzWctmSZDfWUGeliLE313-HqSPCmx667yZfkfIFk2XIz8FgAY3kJ79sl7SeYvfivlrf/exec';

(function () {
  var QUESTIONS = [
    ['q10', '10. Are the animals in sound health, good condition and free from vice?'],
    ['q11', '11. Have any of the animals suffered from any contagious disease/illness?'],
    ['q12', '12. Are the animals well cared for and regularly fed?'],
    ['q13', '13. Are the animals protected against any contagious disease? If so, date of last vaccination'],
    ['q14', '14. Are all four quarters in milk?'],
    ['q15', '15. Are the animals fit for conception / draft / breeding purpose?'],
    ['q16', '16. Do you recommend the risk as normal?'],
    ['q17', '17. Do you recommend the company to accept the risk?']
  ];
  var FIELDS = ['animal','tag','breed','sex','character','age','height','horn','value',
                'noofcalving','dateoflastcalving','milkyield','peakmilkyield'];
  var $ = function (s) { return document.querySelector(s); };
  var list = $('#animalList'), form = $('#certForm'), statusEl = $('#status');
  var animalOpts = ['Cattle','Buffalo','Sheep','Goat','Pig'];
  function opts(a) { return '<option value="">Select</option>' + a.map(function (x) { return '<option>' + x + '</option>'; }).join(''); }
  function field(f, label, ctl, cls) {
    return '<label class="' + (cls || '') + '">' + label + ctl.replace('<', '<').replace(/^<(\w+)/, '<$1 data-f="' + f + '"') + '</label>';
  }

  function rowLabel(i) { // a..z, aa, ab, ...
    var s = ''; i++;
    while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(97 + m) + s; i = Math.floor((i - 1) / 26); }
    return s;
  }

  function addRow() {
    var d = document.createElement('div');
    d.className = 'animal';
    d.innerHTML =
      '<div class="ahead"><strong class="lbl"></strong><button type="button" class="btn ghost rm">Remove</button></div>' +
      '<div class="agrid">' +
      field('animal', 'Animal', '<select>' + opts(animalOpts) + '</select>') +
      field('tag', 'Identification tag no', '<input>') +
      field('breed', 'Breed / ND', '<input>') +
      field('sex', 'Sex', '<select>' + opts(['Male','Female']) + '</select>') +
      field('character', 'Pregnant / calf at foot / colour &amp; marks', '<input>', 'wide') +
      field('age', 'Exact age (yrs)', '<input type="number" min="0" step="0.5">') +
      field('height', 'Height', '<input>') +
      field('horn', 'Horn', '<input>') +
      field('value', 'Market value (Rs)', '<input type="number" min="0">') +
      '<div class="sep">Calving &amp; milk yield</div>' +
      field('noofcalving', 'No. of calving', '<input type="number" min="0">') +
      field('dateoflastcalving', 'Date of last calving', '<input type="date">') +
      field('milkyield', 'Milk now (L/day)', '<input type="number" min="0" step="0.1">') +
      field('peakmilkyield', 'Peak milk (L/day)', '<input type="number" min="0" step="0.1">') +
      '</div>';
    list.appendChild(d);
    refresh();
  }

  function refresh() {
    Array.prototype.forEach.call(list.children, function (d, i) {
      d.querySelector('.lbl').textContent = 'Animal ' + rowLabel(i);
      d.querySelector('.rm').style.visibility = list.children.length > 1 ? 'visible' : 'hidden';
    });
    $('#rowHint').textContent = list.children.length + (list.children.length === 1 ? ' animal' : ' animals') + ' added';
  }

  function buildQuestions() {
    $('#questions').innerHTML = QUESTIONS.map(function (q) {
      var ctl = q[0] === 'q13'
        ? '<input type="text" name="q13" placeholder="e.g. Yes – FMD, 12/05/2026">'
        : '<select name="' + q[0] + '"><option value="">Select</option><option>Yes</option><option>No</option></select>';
      return '<div class="q' + (q[0] === 'q13' ? ' qtext' : '') + '"><span>' + q[1] + '</span>' + ctl + '</div>';
    }).join('');
  }

  function collect() {
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    data.animals = Array.prototype.map.call(list.children, function (tr) {
      var o = {};
      FIELDS.forEach(function (f) { o[f] = tr.querySelector('[data-f="' + f + '"]').value; });
      return o;
    });
    return data;
  }

  function validate() {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (el) {
      var bad = !el.value.trim(); el.classList.toggle('invalid', bad); if (bad) ok = false;
    });
    Array.prototype.forEach.call(list.children, function (tr) {
      ['animal', 'tag'].forEach(function (f) {
        var el = tr.querySelector('[data-f="' + f + '"]');
        var bad = !el.value.trim(); el.classList.toggle('invalid', bad); if (bad) ok = false;
      });
    });
    return ok;
  }

  function showDownloads(on) { $('#pdfBtn').hidden = !on; $('#docxBtn').hidden = !on; }

  function say(msg, cls) { statusEl.textContent = msg; statusEl.className = cls || ''; }

  $('#addRow').addEventListener('click', addRow);
  list.addEventListener('click', function (e) {
    if (!e.target.classList.contains('rm')) return;
    if (list.children.length > 1) { e.target.closest('.animal').remove(); refresh(); }
  });
  form.addEventListener('reset', function () {
    setTimeout(function () { list.innerHTML = ''; addRow(); say(''); showDownloads(false); $('#submitBtn').disabled = false; $('[name=today]').valueAsDate = new Date(); }, 0);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) { say('Please fill the highlighted fields.', 'bad'); return; }
    var btn = $('#submitBtn'); btn.disabled = true; say('Submitting…');
    var data = collect();
    if (!SCRIPT_URL) { console.log(data); say('Preview mode: no SCRIPT_URL set, data logged to console. Downloads are enabled for testing.', 'ok'); showDownloads(true); btn.disabled = false; return; }
    fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
      .then(function (r) {
        return r.text().then(function (text) {
          try {
            return JSON.parse(text);
          } catch (e) {
            throw new Error('Server returned HTML instead of JSON. Check: 1) SPREADSHEET_ID is set in code.gs, 2) Web App redeployed with "Anyone" access, 3) SCRIPT_URL ends with /exec');
          }
        });
      })
      .then(function (res) {
        if (!res.ok) { btn.disabled = false; say('Error: ' + res.error, 'bad'); return; }
        showDownloads(true); say('Submitted successfully. You can now download the PDF or Word file, or click "New form".', 'ok');
      })
      .catch(function (err) { btn.disabled = false; say('Error: ' + err.message, 'bad'); });
  });

  /* ---------- Download as PDF / Word ---------- */
  function fmt(v) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(v || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (v || ''); }
  function dash(v) { return (v === undefined || v === null || v === '') ? '-' : v; }

  function model(d) {
    var A = d.animals;
    var qa = [
      ['7', 'Habitat of animal / source of supply?', d.source || ''],
      ['8', 'No. of calving & the date of last calving', A.map(function (a, i) { return rowLabel(i) + '. ' + dash(a.noofcalving) + ' / ' + dash(fmt(a.dateoflastcalving)); }).join('\n')],
      ['9', 'Milk yield at present in litres/day & peak milk yield expected in litres/day', A.map(function (a, i) { return rowLabel(i) + '. ' + dash(a.milkyield) + ' / ' + dash(a.peakmilkyield); }).join('\n')]
    ];
    QUESTIONS.forEach(function (q) {
      var m = /^(\d+)\.\s*(.*)$/.exec(q[1]);
      qa.push([m[1], m[2], d[q[0]] || '']);
    });
    return {
      owner: [['1', 'Name of the owner', d.name || ''], ['2', 'Farmer ID No. (Fruits)', d.fruits || ''],
              ['3', 'Category', d.category || ''], ['4', 'Address', d.address || ''], ['5', 'Occupation', d.occupation || '']],
      animalHead: ['6', 'Description of the animal/s\n(Cattle / Buffalo / Sheep / Goat / Pig)', 'Identification tag no', 'Breed / ND', 'Sex (if female: pregnant, calf at foot, freshly calved or heifer) & colour / distinguishing marks', 'Exact age (yrs)', 'Height', 'Horn', 'Present market value (Rs)'],
      animalRows: A.map(function (a, i) {
        return [rowLabel(i), a.animal, a.tag, a.breed, [a.sex, a.character].filter(Boolean).join(' - '), a.age, a.height, a.horn, a.value];
      }),
      qa: qa,
      declaration: 'I hereby certify that, I have this day carefully examined the above animal/s described in the schedule and are sound healthy and in good condition at the time of examination. Also I certify that, the insurance company may accept the risk of the said animal/s.',
      sign: ['Name: ' + (d.dr || ''), 'Designation: ' + (d.designation || ''), 'Qualification: ' + (d.qualification || ''), 'KVC No: ' + (d.kvc || ''), 'Seal:'],
      place: 'Place: ' + (d.place || d.institution || ''),
      date: 'Date: ' + fmt(d.today)
    };
  }

  function fileName(d, ext) {
    return 'Animal_Health_Certificate_' + String(d.slno || d.name || 'form').replace(/[^\w-]+/g, '_') + '.' + ext;
  }
  function saveBlob(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function buildPdf(d) {
    if (!window.jspdf) throw new Error('PDF library not loaded (check internet connection).');
    var m = model(d), doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var W = doc.internal.pageSize.getWidth(), y = 14;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('Government of Karnataka', W / 2, y, { align: 'center' }); y += 6;
    doc.text('Department of Animal Husbandry and Veterinary Services', W / 2, y, { align: 'center' }); y += 8;
    doc.setFontSize(12); doc.text('ANIMAL HEALTH CERTIFICATE', W / 2, y, { align: 'center' }); y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('Sl. No: ' + (d.slno || ''), 14, y);
    doc.text('Institution: ' + (d.institution || ''), W - 14, y, { align: 'right' }); y += 4;
    var common = { theme: 'grid', margin: { left: 14, right: 14 },
      styles: { fontSize: 8.5, cellPadding: 1.8, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: 0, overflow: 'linebreak' },
      headStyles: { fillColor: [235, 235, 235], textColor: 0 } };
    doc.autoTable(Object.assign({ startY: y, body: m.owner, columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 60 } } }, common));
    doc.autoTable(Object.assign({
      startY: doc.lastAutoTable.finalY + 4,
      head: [m.animalHead],
      body: m.animalRows,
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 28 },
        2: { cellWidth: 22 },
        3: { cellWidth: 18 },
        4: { cellWidth: 38 },
        5: { cellWidth: 14 },
        6: { cellWidth: 14 },
        7: { cellWidth: 14 },
        8: { cellWidth: 20 }
      },
      headStyles: Object.assign({}, common.headStyles, { fontSize: 7.5, cellPadding: 1.4 })
    }, common));
    doc.autoTable(Object.assign({ startY: doc.lastAutoTable.finalY + 4, body: m.qa, columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 85 } } }, common));
    y = doc.lastAutoTable.finalY + 8;
    if (y > 225) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    var lines = doc.splitTextToSize(m.declaration, W - 28);
    doc.text(lines, 14, y); y += lines.length * 5 + 14;
    doc.text('Signature', W - 14, y, { align: 'right' }); y += 8;
    doc.text(m.place, 14, y); doc.text(m.sign[0], 115, y); y += 6;
    doc.text(m.date, 14, y); doc.text(m.sign[1], 115, y); y += 6;
    doc.text(m.sign[2], 115, y); y += 6;
    doc.text(m.sign[3], 115, y); y += 6;
    doc.text(m.sign[4], 115, y);
    doc.save(fileName(d, 'pdf'));
  }

  function buildDocx(d) {
    if (!window.docx) throw new Error('Word library not loaded (check internet connection).');
    var D = window.docx, m = model(d), FULL = 10466; // A4 width minus 0.5in margins, in twips
    function p(text, o) {
      o = o || {};
      return new D.Paragraph({ alignment: o.align, spacing: { after: o.after == null ? 80 : o.after },
        children: [new D.TextRun({ text: String(text == null ? '' : text), bold: !!o.bold, size: o.size || 20 })] });
    }
    function cell(text, w, bold) {
      return new D.TableCell({ width: { size: Math.round(FULL * w), type: D.WidthType.DXA },
        margins: { top: 40, bottom: 40, left: 70, right: 70 },
        children: String(text == null ? '' : text).split('\n').map(function (t) { return p(t, { bold: bold, size: 18, after: 0 }); }) });
    }
    function table(head, rows, widths) {
      var trs = [];
      if (head) trs.push(new D.TableRow({ tableHeader: true, children: head.map(function (h, i) { return cell(h, widths[i], true); }) }));
      rows.forEach(function (r) { trs.push(new D.TableRow({ children: r.map(function (c, i) { return cell(c, widths[i]); }) })); });
      return new D.Table({ width: { size: FULL, type: D.WidthType.DXA },
        columnWidths: widths.map(function (w) { return Math.round(FULL * w); }), rows: trs });
    }
    var C = D.AlignmentType.CENTER, R = D.AlignmentType.RIGHT;
    var kids = [
      p('Government of Karnataka', { align: C, bold: true, size: 26 }),
      p('Department of Animal Husbandry and Veterinary Services', { align: C, bold: true, size: 24 }),
      p('ANIMAL HEALTH CERTIFICATE', { align: C, bold: true, size: 24, after: 160 }),
      p('Sl. No: ' + (d.slno || '') + '        Institution: ' + (d.institution || ''), { after: 120 }),
      table(null, m.owner, [0.06, 0.34, 0.60]), p('', { after: 80 }),
      table(m.animalHead, m.animalRows, [0.05, 0.16, 0.11, 0.10, 0.24, 0.08, 0.08, 0.08, 0.10]), p('', { after: 80 }),
      table(null, m.qa, [0.06, 0.54, 0.40]), p('', { after: 120 }),
      p(m.declaration, { after: 400 }),
      p('Signature', { align: R, after: 160 }),
      p(m.place), p(m.date, { after: 160 })
    ];
    m.sign.forEach(function (t) { kids.push(p(t, { align: R })); });
    var doc = new D.Document({ sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children: kids }] });
    return D.Packer.toBlob(doc).then(function (blob) { saveBlob(blob, fileName(d, 'docx')); });
  }

  function download(kind) {
    if (!validate()) { say('Please fill the highlighted fields.', 'bad'); return; }
    var d = collect();
    try {
      if (kind === 'pdf') { buildPdf(d); say('PDF downloaded.', 'ok'); }
      else { buildDocx(d).then(function () { say('Word file downloaded.', 'ok'); }, function (e) { say('Error: ' + e.message, 'bad'); }); }
    } catch (e) { say('Error: ' + e.message, 'bad'); }
  }
  $('#pdfBtn').addEventListener('click', function () { download('pdf'); });
  $('#docxBtn').addEventListener('click', function () { download('docx'); });

  buildQuestions();
  $('[name=today]').valueAsDate = new Date();
  addRow();
})();
