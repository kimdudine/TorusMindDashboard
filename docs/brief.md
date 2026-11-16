# Dashboard brief: Torus Mind & Medicine — BD Dashboard

> Written from the Nov 6 meeting (Kim & Stephanie), the Oct 2026 BD & Growth Playbook, the BD tracker, and Kim's intake answers (Nov 15, 2026).

## 1. The job

- **Business:** a physician-led integrative ketamine and mental health practice in Stuart, FL. It grows through referral partners, provider education, community events and Shari's physician network.
- **Who uses it:** Kim (owner of the referral log), Stephanie, Shari (Dr. Samson), Annette · **Devices:** laptop and phone
- **In the first five seconds they need to see:**
  1. Which follow-ups are due or overdue
  2. Where new patients are coming from
  3. Whether each playbook activity is on target
- **Today it lives in:** IntakeQ, plus the Torus BD Tracker sheet · **What falls through:** follow-ups, and attributing patients to a referral source

## 2. Pages

| # | Page | Pattern | What it's for | Main actions |
|---|---|---|---|---|
| 1 | Today | Dashboard | 5 numbers, follow-ups needing attention, source chart, playbook scorecard, upcoming events | Open a partner or event |
| 2 | Referral Partners | List | Every provider, practice, venue and colleague | Search, filter by status/activity, add a partner |
| 3 | Partner | Detail | Status, next step, touch history, patients referred | Log a touch, edit, move stage |
| 4 | Pipeline | Board | Playbook stages as columns | Drag, or "Move to" |
| 5 | Events & Education | List + Detail | Return on investment per event / lunch-and-learn | Add an event, open one |
| 6 | Sources & ROI | Report | Conversion and revenue by source and by BD activity | Change the time range |
| 7 | Calendar | Calendar | Follow-ups and events by month | Open an item |
| 8 | Settings | Settings | Opening date, staff cost, lists, data-state preview | Save settings |

## 3. Records

| Record | Fields that matter | Comes from |
|---|---|---|
| Partner | Contact, organization, type, BD activity, specialty, city, status, owner, next follow-up, next step | Sample (Level 2: imported from the tracker) |
| Touch | Date, partner, method, done by, outcome, note | Sample |
| Event | Name, activity, date, venue, format, attendees, waitlist signups, cost, hours | Sample |
| Lead | IntakeQ client ID only, first contact, source category, source partner/event, consult date, package, value | Sample (Level 2: aggregates only, no patient data) |

## 4. Numbers on the overview (max 5)

| Number | How it's calculated | Good looks like |
|---|---|---|
| New leads (30 days) | Leads with first contact in the last 30 days | Rising month over month |
| Lead → consult rate | Leads with a consult ÷ all leads | ≥ 40% (playbook) |
| Active referrers | Partners at "Active referrer" | Growing |
| Follow-ups overdue | Partners with a next follow-up before today (not "Not a fit") | 0 |
| Revenue ÷ BD cost | Package revenue ÷ (outreach + event cash + hours × staff cost) | > 3× |

## 5. Steps

Cold → Warm → Sent materials → Meeting scheduled → Referral made → Active referrer (plus "Not a fit")

## 6. Look

- **Reference:** Vitalis Care layout (bento, data-friendly), re-skinned fully in Torus branding per Kim
- **Theme:** custom `torus` theme built on the repo's token names · **Mode:** light
- **Brand:**
  - Colors from torusmedicine.com: moss shadow #4a6457, muted grove #809a8c, golden haze #ffe5bd, bronze soil #674f28, solar resin #a37c3f, deep canopy #4d6d71, moon dust #e9e5de, obsidian air #272d32
  - Fonts: DM Sans for body (the brand's own). Jost Light for display, standing in for the licensed Figura Sans.
- **Feel:** calm, grounded, whole · **Motion:** calm
- **Signature element:** a line-drawn torus motif in the overview's welcome band, echoing the logo

## 7. Data and connections

- **Version one data:** labelled fictional sample data. Partner names are invented.
- **Connections:** none in v1. Level 2 adds:
  - Supabase realtime for live updates
  - An IntakeQ export or API pulling counts only
  - Google Calendar
- **Sensitive data:** no patient data, ever. Leads carry an IntakeQ client ID only. Level 2 stores totals, not patient rows. Confirm each vendor's HIPAA terms (BAA) before connecting real data.

## 8. Delivery

- **Level:** 1, clickable prototype
- **Where:** a private artifact link, plus this folder
- **In version one:** all 8 pages, search, filter, sort, drag-and-move pipeline, logging a touch, adding a partner or event, working settings
- **Later:**
  - Login and a database (Level 2)
  - Real partner import from the tracker
  - IntakeQ totals
  - Calendar sync
  - Real-time updates

## 9. Assumptions I made

- Kim picked "use Torus branding" instead of a gallery look. I used Vitalis Care's organised tile layout because it handles the most data, styled entirely in Torus colors and fonts.
- Jost Light stands in for Figura Sans, which is a licensed font. Swap in Figura if Torus has a web license.
- Package values ($450 single, $1,800 4-session, $2,600 6-session, Spravato billed to insurance at $0 cash) are placeholders.
- The brief was treated as approved from the intake answers, so the build went straight ahead. Corrections are cheap at Level 1.

**Approved by:** Kim (intake answers) · Nov 15, 2026
