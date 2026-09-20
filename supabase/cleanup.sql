-- Removes old matches that a faulty sync saved by mistake (anything before the 2025/26 season).
-- Related lineups, absences and predictions for those matches are removed automatically.
delete from fixtures where kickoff < '2025-08-01';
