-- Example events' records
INSERT INTO events (id, title, description, organizer_name, organizer_email, secret_url) VALUES (1, 'First test', 'First time setting an event', ' Tiago', 'tiago@tiago.com', 'secretURL.com');

-- Example time slots' records
INSERT INTO time_slots (id, event_id, date, time) VALUES (10, 1, '2025-01-09', '11:00:00');
INSERT INTO time_slots (id, event_id, date, time) VALUES (11, 1, '2025-01-09', '12:00:00');
INSERT INTO time_slots (id, event_id, date, time) VALUES (12, 1, '2025-01-09', '13:00:00');
INSERT INTO time_slots (id, event_id, date, time) VALUES (13, 1, '2025-01-09', '15:00:00');

-- Example time attendees' records
INSERT INTO attendees (id, event_id, name, email) VALUES (20, 1, 'Murray', 'murray@murray.com');
INSERT INTO attendees (id, event_id, name, email) VALUES (21, 1, 'Hajirah', 'hajirah@hajirah.com');
INSERT INTO attendees (id, event_id, name, email) VALUES (22, 1, 'Maheerah', 'maheerah@maheerah.com');

-- Example time responses' records
-- This record means that Hajirah said ok to the 13:00 time slot
INSERT INTO responses (id, attendee_id, event_id, time_slot_id) VALUES (30, 21, 1, 12);
-- This record means that Maheerah said ok to the 15:00 time slot
INSERT INTO responses (id, attendee_id, event_id, time_slot_id) VALUES (31, 22, 1, 13);
-- This record means that Murray said ok to the 11:00 time slot
INSERT INTO responses (id, attendee_id, event_id, time_slot_id) VALUES (32, 20, 1, 10);
