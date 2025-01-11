-- Example events' records
INSERT INTO events (id, title, description, organizer_name, organizer_email, secret_url)
VALUES
(1, 'First test', 'First time setting an event', 'Tiago', 'tiago@tiago.com', 'secretURL.com'),
(2, 'Weekly Sync', 'A weekly team meeting to discuss progress', 'Alice', 'alice@company.com', 'weekly-sync-url'),
(3, 'Project Kickoff', 'Kickoff meeting for the new project', 'Bob', 'bob@startup.com', 'project-kickoff-url'),
(4, 'Code Review', 'Team session to review recent code commits', 'John', 'john@devteam.com', 'code-review-123');

-- Example time slots' records
INSERT INTO time_slots (id, event_id, date, time) VALUES
(10, 1, '2025-01-09', '11:00:00'),
(11, 1, '2025-01-09', '12:00:00'),
(12, 1, '2025-01-09', '13:00:00'),
(13, 1, '2025-01-09', '15:00:00');


-- Example time attendees' records
INSERT INTO attendees (id, event_id, name, email) VALUES
(20, 1, 'Murray', 'murray@murray.com'),
(21, 1, 'Hajirah', 'hajirah@hajirah.com'),
(22, 1, 'Maheerah', 'maheerah@maheerah.com');


-- Example time responses' records
INSERT INTO responses (id, attendee_id, event_id, time_slot_id) VALUES
(30, 21, 1, 12),  -- This record means that Hajirah said ok to the 13:00 time slot
(31, 22, 1, 13),  -- This record means that Maheerah said ok to the 15:00 time slot
(32, 20, 1, 10);  -- This record means that Murray said ok to the 11:00 time slot

