from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.comments import Comment
from datetime import date

F = "Arial"
TITLE = Font(name=F, size=14, bold=True, color="1F3A4D")
SUB = Font(name=F, size=9, italic=True, color="555555")
HDR = Font(name=F, size=10, bold=True, color="FFFFFF")
HDR_FILL = PatternFill("solid", fgColor="1F3A4D")
FORMULA_FILL = PatternFill("solid", fgColor="EEF3F6")
INPUT_FILL = PatternFill("solid", fgColor="FFF2CC")
EX_FONT = Font(name=F, size=10, italic=True, color="0000FF")
BODY = Font(name=F, size=10)
BLUE = Font(name=F, size=10, color="0000FF")
BOLD = Font(name=F, size=10, bold=True)
SEC = Font(name=F, size=11, bold=True, color="1F3A4D")
thin = Side(style="thin", color="D0D7DE")
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
N = 500  # data rows per table
FIRST = 5
LAST = FIRST + N - 1

wb = Workbook()

# ---------------- Lists ----------------
lists = {
    "Source category": ["Provider referral", "Community event", "Provider education event", "Social media",
                        "Google / organic search", "Email (Flodesk)", "Word of mouth", "Waitlist (other)", "Direct walk-in"],
    "BD activity": ["1. Practice partnerships (Relive +)", "2. Spravato insurance track", "3. Provider education series",
                    "4. Wellness community events", "5. Shari's physician network", "Digital / direct"],
    "Partner type": ["Clinical referrer", "Hospital colleague", "Community venue", "Marketing partner"],
    "Status": ["Cold", "Warm", "Sent materials", "Meeting scheduled", "Referral made", "Active referrer", "Not a fit"],
    "Method": ["Email", "Text", "Phone", "In-person", "Letter", "Zoom", "Event"],
    "Outcome": ["No response", "Replied", "Conversation held", "Meeting scheduled", "Materials sent", "Referral agreed", "Declined"],
    "Owner": ["Kim", "Shari (Dr. Samson)", "Annette", "Stephanie", "Avonny"],
    "Package": ["None yet", "Single infusion", "4-session series", "6-session series", "Spravato (insurance)", "Other"],
    "Event format": ["In-person", "Virtual (Zoom)"],
    "Came in via": ["Discovery form (website)", "Phone call", "Email", "Provider referral form", "At an event", "Walk-in"],
    "Event type": ["Lunch-and-learn", "Webinar", "Open house", "Q&A", "Tea", "Integration circle", "Community talk"],
}
ls = wb.active
ls.title = "Lists"
ranges = {}
for c, (name, vals) in enumerate(lists.items(), start=1):
    col = ls.cell(row=1, column=c).column_letter
    ls.cell(row=1, column=c, value=name).font = HDR
    ls.cell(row=1, column=c).fill = HDR_FILL
    for r, v in enumerate(vals, start=2):
        ls.cell(row=r, column=c, value=v).font = BLUE
    ranges[name] = f"Lists!${col}$2:${col}${len(vals)+1}"
    ls.column_dimensions[col].width = 32
ls.cell(row=15, column=1, value="Edit these lists to change the dropdown choices. Keep 'Source category' identical to the referral pick-list on the IntakeQ discovery form.").font = SUB


def setup(ws, title, sub, headers, widths, formula_cols=()):
    ws["A1"] = title; ws["A1"].font = TITLE
    ws["A2"] = sub; ws["A2"].font = SUB
    ws["A3"] = "Yellow headers = you type here · Grey-blue columns = calculated, don't type · Blue italic row = EXAMPLE, delete it"
    ws["A3"].font = SUB
    for i, (h, w) in enumerate(zip(headers, widths), start=1):
        cell = ws.cell(row=4, column=i, value=h)
        cell.font = HDR; cell.fill = HDR_FILL
        cell.alignment = Alignment(wrap_text=True, vertical="center")
        ws.column_dimensions[cell.column_letter].width = w
        if i not in formula_cols:
            cell.fill = PatternFill("solid", fgColor="B7950B")
    ws.row_dimensions[4].height = 32
    ws.freeze_panes = "B5"
    for r in range(FIRST, LAST + 1):
        for col in formula_cols:
            ws.cell(row=r, column=col).fill = FORMULA_FILL


def dv(ws, list_name, col_letter):
    v = DataValidation(type="list", formula1="=" + ranges[list_name], allow_blank=True)
    v.add(f"{col_letter}{FIRST}:{col_letter}{LAST}")
    ws.add_data_validation(v)


def date_fmt(ws, cols):
    for c in cols:
        for r in range(FIRST, LAST + 1):
            ws[f"{c}{r}"].number_format = "yyyy-mm-dd"

# ---------------- Partners ----------------
pt = wb.create_sheet("Partners", 0)
p_head = ["Partner ID", "Contact name", "Practice / organization", "Type", "BD activity", "Specialty", "City",
          "Contact info", "First outreach (auto)", "Touches (auto)", "Last touch (auto)", "Next follow-up date",
          "Status", "Patients referred (auto)", "Patients converted (auto)", "Owner", "Notes", "First met at (Event ID)", "Last referral (auto)"]
p_w = [10, 22, 30, 17, 28, 18, 16, 30, 13, 9, 12, 13, 17, 11, 11, 16, 40, 14, 13]
setup(pt, "Partners & Providers — referral pipeline (Playbook discipline #2)",
      "One row per provider, practice, venue or colleague. No patient information on this tab. Update status the same day as any interaction.",
      p_head, p_w, formula_cols=(9, 10, 11, 14, 15, 19))
partners = [
    ("P-001", "Dr. Patrick Nolan (CMO)", "Relive Health Stuart", "Clinical referrer", 0, "HRT / cash-pay wellness", "Stuart", "836 SW Federal Hwy", "Shari (Dr. Samson)", "20-min in-person meeting; Annette books. Co-produce HRT-ketamine one-pager. Target: agreement in 60 days, 1st referral in 90."),
    ("P-002", "Ketamine / pain specialist (TBD)", "Pioneer Pain Management", "Clinical referrer", 2, "Pain management", "Port St. Lucie", "", "Kim", "Partnership candidate + education series invite"),
    ("P-003", "Dr. Giovanni Campanile", "Coraeon Functional Medicine", "Clinical referrer", 2, "Functional medicine", "Stuart / Jensen Beach", "", "Kim", "First education event target"),
    ("P-004", "TBD", "Back in Action Medical / Best Life Primary Care", "Clinical referrer", 2, "Primary care", "Palm City / PSL", "", "Kim", "First education event target"),
    ("P-005", "TBD", "OB-GYN practice #1", "Clinical referrer", 2, "OB-GYN", "Stuart", "", "Kim", "Perimenopause-mood angle"),
    ("P-006", "TBD", "OB-GYN practice #2", "Clinical referrer", 2, "OB-GYN", "Palm City", "", "Kim", "Perimenopause-mood angle"),
    ("P-007", "First-responder providers", "PSL Health Center", "Clinical referrer", 2, "Primary care", "Port St. Lucie", "", "Kim", ""),
    ("P-008", "Arienne", "Kula Yoga Shala", "Community venue", 3, "Yoga", "Jupiter", "arienne@kulayogashala.com · (561) 339-9642 · 401 Maplewood Dr Ste 10", "Annette", "Co-host monthly public education events"),
    ("P-009", "TBD", "Bayan Soul Yoga Studio & Boutique", "Community venue", 3, "Yoga", "Stuart", "980 SE Indian St · bayansoulyoga.com", "Annette", ""),
    ("P-010", "TBD", "Breathe Salt & Yoga", "Community venue", 3, "Yoga", "Jupiter", "185 E Indiantown Rd Ste 203 (verify website)", "Annette", ""),
    ("P-011", "Colleague (TBD)", "Palm Beach Gardens Medical Center", "Hospital colleague", 4, "", "Palm Beach Gardens", "", "Shari (Dr. Samson)", "Shari's personal send: 15-min catch-up, not a referral ask"),
    ("P-012", "Colleague (TBD)", "Delray Medical Center", "Hospital colleague", 4, "", "Delray Beach", "", "Shari (Dr. Samson)", ""),
    ("P-013", "Colleague (TBD)", "Cleveland Clinic Florida", "Hospital colleague", 4, "", "", "", "Shari (Dr. Samson)", ""),
]
acts = lists["BD activity"]
for i, (pid, name, org, typ, a, spec, city, contact, owner, notes) in enumerate(partners):
    r = FIRST + i
    vals = {1: pid, 2: name, 3: org, 4: typ, 5: acts[a], 6: spec, 7: city, 8: contact, 13: "Cold", 16: owner, 17: notes}
    for c, v in vals.items():
        pt.cell(row=r, column=c, value=v).font = BODY
for r in range(FIRST, LAST + 1):
    pt[f"I{r}"] = f'=IF(OR($A{r}="",COUNTIF(Outreach!$B${FIRST}:$B${LAST},$A{r})=0),"",_xlfn.MINIFS(Outreach!$A${FIRST}:$A${LAST},Outreach!$B${FIRST}:$B${LAST},$A{r}))'
    pt[f"J{r}"] = f'=IF($A{r}="","",COUNTIF(Outreach!$B${FIRST}:$B${LAST},$A{r}))'
    pt[f"K{r}"] = f'=IF(OR($A{r}="",COUNTIF(Outreach!$B${FIRST}:$B${LAST},$A{r})=0),"",_xlfn.MAXIFS(Outreach!$A${FIRST}:$A${LAST},Outreach!$B${FIRST}:$B${LAST},$A{r}))'
    pt[f"N{r}"] = f"=IF($A{r}=\"\",\"\",COUNTIF('Patient Pipeline'!$D${FIRST}:$D${LAST},$A{r}))"
    pt[f"O{r}"] = f"=IF($A{r}=\"\",\"\",COUNTIFS('Patient Pipeline'!$D${FIRST}:$D${LAST},$A{r},'Patient Pipeline'!$L${FIRST}:$L${LAST},\"Converted\"))"
    pt[f"S{r}"] = f"=IF(OR($A{r}=\"\",COUNTIF('Patient Pipeline'!$D${FIRST}:$D${LAST},$A{r})=0),\"\",_xlfn.MAXIFS('Patient Pipeline'!$B${FIRST}:$B${LAST},'Patient Pipeline'!$D${FIRST}:$D${LAST},$A{r}))"
    for c in "IJKNOS":
        pt[f"{c}{r}"].font = BODY
date_fmt(pt, "IKLS")
for name, col in [("Partner type", "D"), ("BD activity", "E"), ("Status", "M"), ("Owner", "P")]:
    dv(pt, name, col)
pt.conditional_formatting.add(f"L{FIRST}:L{LAST}", FormulaRule(
    formula=[f'AND($L{FIRST}<>"",$L{FIRST}<TODAY(),$M{FIRST}<>"Active referrer",$M{FIRST}<>"Not a fit")'],
    fill=PatternFill("solid", fgColor="F4CCCC")))
pt["L4"].comment = Comment("Turns red when the follow-up date has passed.", "Beyond Consulting")

# ---------------- Outreach ----------------
ot = wb.create_sheet("Outreach", 1)
o_head = ["Date", "Partner ID", "Partner (auto)", "BD activity (auto)", "Method", "Done by", "Outcome", "Hours", "Cost ($)", "Next step"]
setup(ot, "Outreach Log — every touch with a partner",
      "One row per email, call, meeting, letter or visit. Pick the Partner ID; name and activity fill in. No patient information.",
      o_head, [12, 10, 34, 28, 12, 18, 18, 8, 10, 40], formula_cols=(3, 4))
ex = [date(2026, 11, 10), "P-001", None, None, "Email", "Annette", "Meeting scheduled", 0.5, 0, "EXAMPLE – delete this row. Meeting at Relive 11/20"]
for c, v in enumerate(ex, start=1):
    if v is not None:
        ot.cell(row=FIRST, column=c, value=v).font = EX_FONT
for r in range(FIRST, LAST + 1):
    ot[f"C{r}"] = f'=IF($B{r}="","",IFERROR(INDEX(Partners!$C${FIRST}:$C${LAST},MATCH($B{r},Partners!$A${FIRST}:$A${LAST},0)),"Unknown ID"))'
    ot[f"D{r}"] = f'=IF($B{r}="","",IFERROR(INDEX(Partners!$E${FIRST}:$E${LAST},MATCH($B{r},Partners!$A${FIRST}:$A${LAST},0)),""))'
    ot[f"I{r}"].number_format = '$#,##0'
date_fmt(ot, "A")
for name, col in [("Method", "E"), ("Owner", "F"), ("Outcome", "G")]:
    dv(ot, name, col)

# ---------------- Events ----------------
ev = wb.create_sheet("Events", 2)
e_head = ["Event ID", "Event name", "BD activity", "Date", "Venue / partner ID", "Format", "Attendees", "Waitlist signups",
          "Signup rate (auto)", "Consults within 30 days (auto)", "Packages sold (auto)", "Revenue (auto)", "Cost ($)", "Hours",
          "Meets target (auto)", "Event type", "Professional contacts made (auto)"]
setup(ev, "Events & Education — ROI log (Playbook discipline #5)",
      "One row per community event, lunch-and-learn or education session. Give each attendee who joins the waitlist this Event ID as their source.",
      e_head, [10, 40, 28, 12, 16, 14, 10, 10, 10, 12, 10, 12, 10, 8, 12, 18, 14], formula_cols=(9, 10, 11, 12, 15, 17))
exe = ["E-001", "EXAMPLE – What is ketamine therapy? (delete row)", acts[3], date(2026, 12, 4), "P-009", "In-person", 14, 4, None, None, None, None, 150, 4, None, "Community talk"]
for c, v in enumerate(exe, start=1):
    if v is not None:
        ev.cell(row=FIRST, column=c, value=v).font = EX_FONT
PP = "'Patient Pipeline'"
for r in range(FIRST, LAST + 1):
    ev[f"I{r}"] = f'=IF(OR($A{r}="",N($G{r})=0),"",$H{r}/$G{r})'
    ev[f"J{r}"] = f'=IF($A{r}="","",COUNTIFS({PP}!$D${FIRST}:$D${LAST},$A{r},{PP}!$H${FIRST}:$H${LAST},">="&$D{r},{PP}!$H${FIRST}:$H${LAST},"<="&($D{r}+30)))'
    ev[f"K{r}"] = f'=IF($A{r}="","",COUNTIFS({PP}!$D${FIRST}:$D${LAST},$A{r},{PP}!$L${FIRST}:$L${LAST},"Converted"))'
    ev[f"L{r}"] = f'=IF($A{r}="","",SUMIFS({PP}!$J${FIRST}:$J${LAST},{PP}!$D${FIRST}:$D${LAST},$A{r}))'
    ev[f"O{r}"] = f'=IF(OR($A{r}="",$G{r}=""),"",IF(AND($G{r}>=Dashboard!$C$8,N($I{r})>=Dashboard!$C$9),"Yes","No"))'
    ev[f"Q{r}"] = f'=IF($A{r}="","",COUNTIF(Partners!$R${FIRST}:$R${LAST},$A{r}))'
    ev[f"I{r}"].number_format = "0%"
    ev[f"L{r}"].number_format = '$#,##0'
    ev[f"M{r}"].number_format = '$#,##0'
date_fmt(ev, "D")
for name, col in [("BD activity", "C"), ("Event format", "F"), ("Event type", "P")]:
    dv(ev, name, col)

# ---------------- Patient Pipeline ----------------
pp = wb.create_sheet("Patient Pipeline", 3)
q_head = ["IntakeQ Client ID", "First contact date", "Source category", "Source ID (P-### or E-###)", "Source detail",
          "BD activity (auto)", "Joined waitlist", "Consult booked", "Package", "Package value ($)", "Days to consult (auto)", "Stage (auto)", "Came in via"]
setup(pp, "Patient Pipeline — IntakeQ client IDs ONLY (Playbook disciplines #1 and #3)",
      "NEVER enter names, phone numbers, emails or clinical notes here. Use the IntakeQ Client ID. Paste from the IntakeQ export weekly.",
      q_head, [16, 13, 22, 16, 24, 28, 12, 12, 18, 12, 11, 15, 22], formula_cols=(6, 11, 12))
exq = ["EX-0001", date(2026, 12, 4), "Community event", "E-001", "EXAMPLE – delete this row", None, date(2026, 12, 4), date(2026, 12, 11), "4-session series", 2400, None, None, "Discovery form (website)"]
for c, v in enumerate(exq, start=1):
    if v is not None:
        pp.cell(row=FIRST, column=c, value=v).font = EX_FONT
pp["J4"].comment = Comment("Placeholder example value. Use Torus's actual package prices.", "Beyond Consulting")
for r in range(FIRST, LAST + 1):
    pp[f"F{r}"] = (f'=IF($A{r}="","",IF($D{r}="","Digital / direct",IFERROR(IF(LEFT($D{r},2)="P-",'
                   f'INDEX(Partners!$E${FIRST}:$E${LAST},MATCH($D{r},Partners!$A${FIRST}:$A${LAST},0)),'
                   f'INDEX(Events!$C${FIRST}:$C${LAST},MATCH($D{r},Events!$A${FIRST}:$A${LAST},0))),"Check Source ID")))')
    pp[f"K{r}"] = f'=IF(OR($B{r}="",$H{r}=""),"",$H{r}-$B{r})'
    pp[f"L{r}"] = (f'=IF($A{r}="","",IF(AND($I{r}<>"",$I{r}<>"None yet"),"Converted",'
                   f'IF($H{r}<>"","Consult booked",IF($G{r}<>"","Waitlist","Lead"))))')
    pp[f"J{r}"].number_format = '$#,##0'
date_fmt(pp, "BGH")
for name, col in [("Source category", "C"), ("Package", "I"), ("Came in via", "M")]:
    dv(pp, name, col)

# ---------------- Dashboard ----------------
db = wb.create_sheet("Dashboard", 0)
db.column_dimensions["A"].width = 2
db.column_dimensions["B"].width = 44
for c in "CDEFGHIJ":
    db.column_dimensions[c].width = 15
db["B1"] = "Torus BD Dashboard"; db["B1"].font = TITLE
db["B2"] = "Everything below calculates from the other tabs. Only the yellow cells are typed."; db["B2"].font = SUB

db["B4"] = "SETTINGS"; db["B4"].font = SEC
settings = [
    ("Practice opening date", date(2027, 1, 5), "yyyy-mm-dd", "Placeholder – set to Torus's actual opening date. Drives the 30/60/90-day targets."),
    ("Staff time cost ($/hr) for ROI", 50, '$#,##0', "Placeholder blended staff cost – adjust. Used to cost the Hours columns."),
    ("Target: waitlist → consult rate", 0.40, "0%", "From Playbook discipline #3"),
    ("Target: attendees per event", 10, "0", "From Playbook Activity 4"),
    ("Target: event waitlist signup rate", 0.20, "0%", "From Playbook Activity 4"),
]
for i, (lab, val, fmt, note) in enumerate(settings):
    r = 5 + i
    db[f"B{r}"] = lab; db[f"B{r}"].font = BODY
    c = db[f"C{r}"]; c.value = val; c.number_format = fmt; c.fill = INPUT_FILL; c.font = BLUE; c.border = BOX
    db[f"D{r}"] = note; db[f"D{r}"].font = SUB

PPr = lambda col: f"{PP}!${col}${FIRST}:${col}${LAST}"
db["B11"] = "HEADLINE"; db["B11"].font = SEC
heads = [
    ("Total leads", f'=COUNTA({PPr("A")})', "0"),
    ("Joined waitlist", f'=COUNT({PPr("G")})', "0"),
    ("Consults booked", f'=COUNT({PPr("H")})', "0"),
    ("Converted to a package", f'=COUNTIF({PPr("L")},"Converted")', "0"),
    ("Lead → consult rate", "=IF(C12=0,\"\",C14/C12)", "0%"),
    ("Waitlist → consult rate", f'=IF(C13=0,"",COUNTIFS({PPr("G")},"<>",{PPr("H")},"<>")/C13)', "0%"),
    ("Revenue from tracked patients", f'=SUM({PPr("J")})', '$#,##0'),
    ("Avg days first contact → consult", f'=IFERROR(AVERAGE({PPr("K")}),"")', "0.0"),
]
for i, (lab, f, fmt) in enumerate(heads):
    r = 12 + i
    db[f"B{r}"] = lab; db[f"B{r}"].font = BODY
    db[f"C{r}"] = f; db[f"C{r}"].number_format = fmt; db[f"C{r}"].font = BOLD; db[f"C{r}"].border = BOX
db["D17"] = '=IF(C17="","",IF(C17>=C7,"On target","Below 40% – review follow-up cadence"))'
db["D17"].font = SUB

def table_header(r, cols):
    for i, h in enumerate(cols):
        c = db.cell(row=r, column=2 + i, value=h)
        c.font = HDR; c.fill = HDR_FILL; c.alignment = Alignment(wrap_text=True, vertical="center")
    db.row_dimensions[r].height = 30

r0 = 21
db[f"B{r0}"] = "BY REFERRAL SOURCE"; db[f"B{r0}"].font = SEC
table_header(r0 + 1, ["Source category", "Leads", "Consults", "Converted", "Conversion %", "Revenue"])
for i, s in enumerate(lists["Source category"]):
    r = r0 + 2 + i
    db[f"B{r}"] = s; db[f"B{r}"].font = BODY
    db[f"C{r}"] = f'=COUNTIF({PPr("C")},$B{r})'
    db[f"D{r}"] = f'=COUNTIFS({PPr("C")},$B{r},{PPr("H")},"<>")'
    db[f"E{r}"] = f'=COUNTIFS({PPr("C")},$B{r},{PPr("L")},"Converted")'
    db[f"F{r}"] = f'=IF(C{r}=0,"",E{r}/C{r})'; db[f"F{r}"].number_format = "0%"
    db[f"G{r}"] = f'=SUMIFS({PPr("J")},{PPr("C")},$B{r})'; db[f"G{r}"].number_format = '$#,##0'
src_end = r0 + 1 + len(lists["Source category"])

r1 = src_end + 3
db[f"B{r1}"] = "BY BD ACTIVITY (ROI)"; db[f"B{r1}"].font = SEC
table_header(r1 + 1, ["BD activity", "Partners", "Active referrers", "Outreach touches", "Events held", "Patients sourced",
                      "Converted", "Revenue", "Cost (cash + time)", "Revenue ÷ cost"])
for c in "KL":
    db.column_dimensions[c].width = 15
OR_ = lambda col: f"Outreach!${col}${FIRST}:${col}${LAST}"
PR_ = lambda col: f"Partners!${col}${FIRST}:${col}${LAST}"
EV_ = lambda col: f"Events!${col}${FIRST}:${col}${LAST}"
for i, a in enumerate(acts):
    r = r1 + 2 + i
    db[f"B{r}"] = a; db[f"B{r}"].font = BODY
    db[f"C{r}"] = f'=COUNTIF({PR_("E")},$B{r})'
    db[f"D{r}"] = f'=COUNTIFS({PR_("E")},$B{r},{PR_("M")},"Active referrer")'
    db[f"E{r}"] = f'=COUNTIF({OR_("D")},$B{r})'
    db[f"F{r}"] = f'=COUNTIF({EV_("C")},$B{r})'
    db[f"G{r}"] = f'=COUNTIF({PPr("F")},$B{r})'
    db[f"H{r}"] = f'=COUNTIFS({PPr("F")},$B{r},{PPr("L")},"Converted")'
    db[f"I{r}"] = f'=SUMIFS({PPr("J")},{PPr("F")},$B{r})'
    db[f"J{r}"] = (f'=SUMIFS({OR_("I")},{OR_("D")},$B{r})+SUMIFS({EV_("M")},{EV_("C")},$B{r})'
                   f'+(SUMIFS({OR_("H")},{OR_("D")},$B{r})+SUMIFS({EV_("N")},{EV_("C")},$B{r}))*$C$6')
    db[f"K{r}"] = f'=IF(J{r}=0,"",I{r}/J{r})'
    for c in "IJ":
        db[f"{c}{r}"].number_format = '$#,##0'
    db[f"K{r}"].number_format = '0.0"x"'
act_end = r1 + 1 + len(acts)

r2 = act_end + 3
db[f"B{r2}"] = "PLAYBOOK SUCCESS METRICS"; db[f"B{r2}"].font = SEC
table_header(r2 + 1, ["Metric", "Target", "Actual", "Status"])
O = "$C$5"
a = {k: f'"{v}"' for k, v in zip(range(6), acts)}
metrics = [
    ("A1 · Relive: referral agreement within 60 days", "Active referrer",
     f'=IFERROR(INDEX({PR_("M")},MATCH("P-001",{PR_("A")},0)),"")', "text"),
    ("A1 · Relive: first referral within 90 days", 1,
     f'=COUNTIFS({PPr("D")},"P-001",{PPr("B")},"<="&({O}+90))', "num"),
    ("A2 · Spravato-specific referrals, first quarter", 3,
     f'=COUNTIFS({PPr("F")},{a[1]},{PPr("B")},"<="&({O}+90))', "num"),
    ("A3 · Referrals traced to education series, first 6 months", 2,
     f'=COUNTIFS({PPr("F")},{a[2]},{PPr("B")},"<="&({O}+182))', "num"),
    ("A4 · Community events held, months 1–3 (1–2/month)", 3,
     f'=COUNTIFS({EV_("C")},{a[3]},{EV_("D")},">="&{O},{EV_("D")},"<="&({O}+91))', "num"),
    ("A4 · Average attendees per community event", "=C8",
     f'=IFERROR(AVERAGEIFS({EV_("G")},{EV_("C")},{a[3]}),"")', "num"),
    ("A4 · Average waitlist signup rate per event", "=C9",
     f'=IFERROR(SUMIFS({EV_("H")},{EV_("C")},{a[3]})/SUMIFS({EV_("G")},{EV_("C")},{a[3]}),"")', "pct"),
    ("A5 · Shari's messages sent, first 30 days", 10,
     f'=COUNTIFS({OR_("D")},{a[4]},{OR_("A")},">="&({O}-30),{OR_("A")},"<="&({O}+30))', "num"),
    ("A5 · Conversations initiated", 5,
     f'=COUNTIFS({OR_("D")},{a[4]},{OR_("G")},"Conversation held")+COUNTIFS({OR_("D")},{a[4]},{OR_("G")},"Meeting scheduled")', "num"),
    ("A5 · Physician-network referrals within 60 days", 2,
     f'=COUNTIFS({PPr("F")},{a[4]},{PPr("B")},"<="&({O}+60))', "num"),
    ("D3 · Waitlist → consult rate", "=C7", "=C17", "pct"),
]
for i, (lab, tgt, f, kind) in enumerate(metrics):
    r = r2 + 2 + i
    db[f"B{r}"] = lab; db[f"B{r}"].font = BODY
    db[f"C{r}"] = tgt; db[f"D{r}"] = f
    if kind == "pct":
        db[f"C{r}"].number_format = "0%"; db[f"D{r}"].number_format = "0%"
    if kind == "text":
        db[f"E{r}"] = f'=IF(D{r}=C{r},"✓ Met","Not yet")'
    else:
        db[f"E{r}"] = f'=IF(D{r}="","No data",IF(D{r}>=C{r},"✓ Met","Not yet"))'
    if isinstance(tgt, (int, float)):
        db[f"C{r}"].font = BLUE
met_end = r2 + 1 + len(metrics)
db.conditional_formatting.add(f"E{r2+2}:E{met_end}", FormulaRule(formula=[f'LEFT(E{r2+2},1)="✓"'],
                              fill=PatternFill("solid", fgColor="D9EAD3")))
rc = met_end + 3
db[f"B{rc}"] = "HOW PATIENTS CAME IN (incl. website discovery form)"; db[f"B{rc}"].font = SEC
table_header(rc + 1, ["Came in via", "Leads", "Last 30 days", "Consults", "Converted", "Lead → consult"])
for i, chn in enumerate(lists["Came in via"]):
    r = rc + 2 + i
    db[f"B{r}"] = chn; db[f"B{r}"].font = BOLD if i == 0 else BODY
    db[f"C{r}"] = f'=COUNTIF({PPr("M")},$B{r})'
    db[f"D{r}"] = f'=COUNTIFS({PPr("M")},$B{r},{PPr("B")},">="&(TODAY()-30))'
    db[f"E{r}"] = f'=COUNTIFS({PPr("M")},$B{r},{PPr("H")},"<>")'
    db[f"F{r}"] = f'=COUNTIFS({PPr("M")},$B{r},{PPr("L")},"Converted")'
    db[f"G{r}"] = f'=IF(C{r}=0,"",E{r}/C{r})'; db[f"G{r}"].number_format = "0%"
met_end = rc + 1 + len(lists["Came in via"])
db[f"B{met_end+2}"] = ("Windows count from the opening date in C5. Clinical outcomes (discipline #4) and web/social tracking (#6) "
                       "stay in IntakeQ and Google Analytics, not in this workbook.")
db[f"B{met_end+2}"].font = SUB

# ---------------- Start Here ----------------
sh = wb.create_sheet("Start Here", 0)
sh.column_dimensions["A"].width = 2
sh.column_dimensions["B"].width = 110
lines = [
    ("Torus Mind Medicine — BD Tracker", TITLE),
    ("Built by Beyond Consulting from the Oct 2026 BD & Growth Playbook. Version 1, Nov 2026.", SUB),
    ("", None),
    ("BEFORE ANYONE ENTERS DATA — HIPAA", SEC),
    ("1. This file must live in Torus's paid Google Workspace with Google's HIPAA BAA accepted (Admin console › Account › Legal). Never in a personal @gmail.com Drive.", BODY),
    ("2. Patient Pipeline takes IntakeQ Client IDs only — no names, phone numbers, emails or clinical details anywhere in this workbook.", BODY),
    ("3. Share only with named Torus/Beyond staff. Never 'Anyone with the link'. Don't connect Zapier or other add-ons that read this sheet.", BODY),
    ("", None),
    ("TABS", SEC),
    ("Dashboard — read-only results: headline numbers, results by referral source, ROI by BD activity, and progress against the playbook's success metrics.", BODY),
    ("Partners — every provider, practice, venue and colleague in the referral pipeline (pre-loaded with the playbook's named targets). Owner: Kim.", BODY),
    ("Outreach — one row per touch (email, call, meeting, letter). Keeps 'first outreach', 'last touch' and touch counts current on Partners automatically.", BODY),
    ("Events — one row per community event or lunch-and-learn; consults within 30 days and packages sold calculate automatically.", BODY),
    ("Patient Pipeline — one row per new lead by IntakeQ Client ID, with source category and the Partner or Event ID that brought them in.", BODY),
    ("Lists — dropdown choices. Keep 'Source category' identical to the referral question on the IntakeQ discovery form.", BODY),
    ("", None),
    ("HOW TO USE IT", SEC),
    ("• Yellow column headers = type here. Grey-blue columns = calculated, don't type over them. Blue italic rows are examples — delete them before going live.", BODY),
    ("• Same day: log every partner touch on Outreach and update Status on Partners. Red follow-up dates are overdue.", BODY),
    ("• Each event: add the event on Events and give it an ID (E-002 and so on). Use that ID as the Source ID for every attendee who becomes a lead.", BODY),
    ("• Weekly: export new clients from IntakeQ (with the referral-source field), paste Client ID, date, source, Source ID and 'Came in via' (Discovery form, phone, email…) into Patient Pipeline, then update consult and package columns. The Dashboard counts discovery-form patients automatically.", BODY),
    ("• When you meet a new provider at an event, put that Event ID in 'First met at' on Partners. Events then shows how many professional contacts each event produced.", BODY),
    ("• Monthly/quarterly: review the Dashboard. Shift time toward the activities with the highest revenue ÷ cost and conversion rate.", BODY),
    ("", None),
    ("SETUP CHECKLIST", SEC),
    ("☐ Stephanie: IntakeQ discovery form has a REQUIRED 'How did you hear about us?' field using the Source category list, plus 'Referring provider / practice' and 'Event attended' fields.", BODY),
    ("☐ Confirm Torus's Google Workspace BAA is accepted, then import this file into that Drive (File › Import in Google Sheets).", BODY),
    ("☐ Set the practice opening date and staff time cost on the Dashboard (yellow cells).", BODY),
    ("☐ Fill in TBD contact names on Partners. Add Spravato-track PCPs and psychiatrists as they're identified.", BODY),
    ("☐ Phase 2 (optional): check whether Torus's IntakeQ plan includes API/webhook access, so new clients flow in automatically instead of by weekly paste.", BODY),
]
for i, (t, f) in enumerate(lines, start=1):
    c = sh.cell(row=i, column=2, value=t)
    if f: c.font = f
    c.alignment = Alignment(wrap_text=True, vertical="top")

wb._sheets = [wb["Start Here"], wb["Dashboard"], wb["Partners"], wb["Outreach"], wb["Events"], wb["Patient Pipeline"], wb["Lists"]]
for ws in wb.worksheets:
    for row in ws.iter_rows():
        for c in row:
            if c.font is None or c.font.name != F:
                c.font = Font(name=F, size=c.font.size if c.font else 10, bold=c.font.bold, italic=c.font.italic, color=c.font.color)
wb.active = 0
import os
wb.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), "Torus_BD_Tracker.xlsx"))
print("saved")
