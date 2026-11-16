-- Optional: load the referral targets named in the Oct 2026 BD & Growth Playbook.
-- These are real businesses from the playbook (public business info only). Everything starts at "Cold".
-- Run after schema.sql. Safe to re-run: existing rows are left alone.
insert into public.partners (id, contact, org, type, activity, specialty, city, phone, status, owner, next_step) values
  ('P-001', 'Dr. Patrick Nolan (CMO)', 'Relive Health Stuart', 'Clinical referrer', 'A1', 'HRT / cash-pay wellness', 'Stuart', '', 'Cold', 'Shari', '20-min in-person meeting; co-produce HRT–ketamine one-pager'),
  ('P-002', 'Ketamine / pain specialist (TBD)', 'Pioneer Pain Management', 'Clinical referrer', 'A1', 'Pain management', 'Port St. Lucie', '', 'Cold', 'Kim', 'Partnership intro + education series invite'),
  ('P-003', 'Dr. Giovanni Campanile', 'Coraeon Functional Medicine', 'Clinical referrer', 'A3', 'Functional medicine', 'Stuart / Jensen Beach', '', 'Cold', 'Kim', 'Invite to first lunch-and-learn'),
  ('P-004', 'TBD', 'Back in Action Medical / Best Life Primary Care', 'Clinical referrer', 'A3', 'Primary care', 'Palm City / PSL', '', 'Cold', 'Kim', 'Invite to first lunch-and-learn'),
  ('P-005', 'TBD', 'OB-GYN practice #1', 'Clinical referrer', 'A3', 'OB-GYN', 'Stuart', '', 'Cold', 'Kim', 'Perimenopause–mood brief'),
  ('P-006', 'TBD', 'OB-GYN practice #2', 'Clinical referrer', 'A3', 'OB-GYN', 'Palm City', '', 'Cold', 'Kim', 'Perimenopause–mood brief'),
  ('P-007', 'First-responder providers', 'PSL Health Center', 'Clinical referrer', 'A3', 'Primary care', 'Port St. Lucie', '', 'Cold', 'Kim', 'Invite to first lunch-and-learn'),
  ('P-008', 'Arienne', 'Kula Yoga Shala', 'Community venue', 'A4', 'Yoga studio', 'Jupiter', '', 'Cold', 'Annette', 'Propose monthly co-hosted talk'),
  ('P-009', 'TBD', 'Bayan Soul Yoga Studio & Boutique', 'Community venue', 'A4', 'Yoga studio', 'Stuart', '', 'Cold', 'Annette', 'Propose monthly co-hosted talk'),
  ('P-010', 'TBD', 'Breathe Salt & Yoga', 'Community venue', 'A4', 'Yoga studio', 'Jupiter', '', 'Cold', 'Annette', 'Propose monthly co-hosted talk'),
  ('P-011', 'Colleague (TBD)', 'Palm Beach Gardens Medical Center', 'Hospital colleague', 'A5', '', 'Palm Beach Gardens', '', 'Cold', 'Shari', 'Personal note: 15-min catch-up'),
  ('P-012', 'Colleague (TBD)', 'Delray Medical Center', 'Hospital colleague', 'A5', '', 'Delray Beach', '', 'Cold', 'Shari', 'Personal note: 15-min catch-up'),
  ('P-013', 'Colleague (TBD)', 'Cleveland Clinic Florida', 'Hospital colleague', 'A5', '', '', '', 'Cold', 'Shari', 'Personal note: 15-min catch-up')
on conflict (id) do nothing;
