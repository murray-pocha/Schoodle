DROP TABLE IF EXISTS events CASCADE;
CREATE TABLE events (
  id SERIAL PRIMARY KEY NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  organizer_name VARCHAR(255) NOT NULL,
  organizer_email VARCHAR(255) NOT NULL,
  secret_url VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE time_slots (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  UNIQUE (event_id, date, time)
);

CREATE TABLE attendees (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  UNIQUE (event_id, email)
 );

CREATE TABLE responses (
  id SERIAL PRIMARY KEY,
  attendee_id INT REFERENCES attendees(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  time_slot_id INT REFERENCES time_slots(id) ON DELETE CASCADE,
  updated_at TIMESTAMP DEFAULT NOW()
);
