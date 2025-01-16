
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');

// Route to render new event creation form
router.get('/new', (req, res) => {
  res.render('new-event');
});

// Route to create a new event
router.post('/', (req, res) => {
  const { title, description, eventDate1, eventTime1, eventDate2, eventTime2, name, email } = req.body;

  if (!title || !description || !eventDate1 || !eventTime1 || !eventDate2 || !eventTime2 || !name || !email) {
    return res.status(400).send('All fields are required.');
  }

  const secretUrl = uuidv4();
  const query = `
    INSERT INTO events (title, description, organizer_name, organizer_email, secret_url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, secret_url;
  `;
  const values = [title, description, name, email, secretUrl];

  db.query(query, values)
    .then(result => {
      const event = result.rows[0];
      const timeSlotQuery = `
        INSERT INTO time_slots (event_id, date1, time1, date2, time2)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      const timeSlotValues = [event.id, eventDate1, eventTime1, eventDate2, eventTime2];

      return db.query(timeSlotQuery, timeSlotValues).then(() => {
        res.redirect(`/events/event-details?eventId=${event.id}`);
      });
    })
    .catch(err => {
      console.error('Error saving event to database:', err.stack);
      res.status(500).send('An error occurred while creating the event.');
    });
});

// Route to fetch and display event details
router.get('/event-details', (req, res) => {
  const eventId = req.query.eventId;

  if (!eventId) {
    return res.status(400).send("Event ID is required.");
  }

  const eventQuery = `
    SELECT * FROM events WHERE id = $1;
  `;
  const timeSlotsQuery = `
    SELECT date1 AS date1, time1 AS time1, date2 AS date2, time2 AS time2
    FROM time_slots
    WHERE event_id = $1;
  `;

  db.query(eventQuery, [eventId])
    .then(eventResult => {
      const event = eventResult.rows[0];

      if (!event) {
        return res.status(404).send('Event not found.');
      }

      db.query(timeSlotsQuery, [eventId])
        .then(timeSlotsResult => {
          const timeSlots = timeSlotsResult.rows[0];
          const eventDetails = {
            title: event.title,
            description: event.description,
            organizer_name: event.organizer_name,
            organizer_email: event.organizer_email,
            secret_url: event.secret_url,
            date1: timeSlots.date1,
            time1: timeSlots.time1,
            date2: timeSlots.date2,
            time2: timeSlots.time2
          };

          res.render('event-details', { eventDetails });
        })
        .catch(err => {
          console.error('Error fetching time slots:', err);
          res.status(500).send('Error fetching time slots.');
        });
    })
    .catch(err => {
      console.error('Error fetching event:', err.stack);
      res.status(500).send('An error occurred while fetching the event.');
    });
});

// Route to render the attendee form
router.get('/:event_id/attendees/new', (req, res) => {
  const { event_id } = req.params;

  const eventQuery = `
    SELECT * FROM events
    WHERE secret_url = $1;
  `;

  const timeSlotsQuery = `
    SELECT id, date1 AS date, time1 AS time
    FROM time_slots
    WHERE event_id = (
      SELECT id FROM events WHERE secret_url = $1
    );
  `;

  db.query(eventQuery, [event_id])
    .then(eventResult => {
      const event = eventResult.rows[0];

      if (!event) {
        return res.status(404).send('Event not found.');
      }

      console.log('Event found:', event);

      db.query(timeSlotsQuery, [event_id])
        .then(timeSlotsResult => {
          console.log('Time slots:', timeSlotsResult.rows);
          const timeSlots = timeSlotsResult.rows;

          res.render('attendee', { event, timeSlots });
        })
        .catch(err => {
          console.error('Error fetching time slots:', err);
          res.status(500).send('Error fetching time slots.');
        });
    })
    .catch(err => {
      console.error('Error fetching event:', err);
      res.status(500).send('An error occurred while fetching the event.');
    });
});

// Route to handle attendee form submission
router.post('/:event_id/attendees', (req, res) => {
  const { event_id } = req.params;
  const { name, email, ...availability } = req.body;

  if (!name || !email) {
    return res.status(400).send('Name and email are required.');
  }

  const insertAttendeeQuery = `
    INSERT INTO attendees (event_id, name, email)
    VALUES ($1, $2, $3)
    RETURNING id;
  `;
  const insertResponseQuery = `
    INSERT INTO responses (attendee_id, event_id, time_slot_id, response)
    VALUES ($1, $2, $3, $4);
  `;

  db.query(insertAttendeeQuery, [event_id, name, email])
    .then(attendeeResult => {
      const attendeeId = attendeeResult.rows[0].id;

      const responsePromises = Object.entries(availability).map(([key, value]) => {
        if (key.startsWith('availability_')) {
          const timeSlotId = key.split('_')[1];
          return db.query(insertResponseQuery, [attendeeId, event_id, timeSlotId, value]);
        }
      });

      return Promise.all(responsePromises);
    })
    .then(() => {
      res.redirect(`/events/${event_id}/responses`);
    })
    .catch(err => {
      console.error('Error saving attendee or responses:', err);
      res.status(500).send('An error occurred while saving your response.');
    });
});

// Route to fetch and display responses
router.get('/:event_id/responses', (req, res) => {
  const { event_id } = req.params;

  const eventQuery = `
    SELECT * FROM events WHERE id = $1;
  `;
  const timeSlotsQuery = `
    SELECT id, date1 AS date, time1 AS time
    FROM time_slots
    WHERE event_id = $1;
  `;
  const responsesQuery = `
    SELECT 
      attendees.name AS attendee_name,
      attendees.email AS attendee_email,
      time_slots.date AS date,
      time_slots.time AS time,
      responses.response AS response,
      responses.updated_at AS response_time
    FROM responses
    JOIN attendees ON responses.attendee_id = attendees.id
    JOIN time_slots ON responses.time_slot_id = time_slots.id
    WHERE responses.event_id = $1;
  `;

  db.query(eventQuery, [event_id])
    .then(eventResult => {
      const event = eventResult.rows[0];

      if (!event) {
        return res.status(404).send('Event not found.');
      }

      db.query(timeSlotsQuery, [event_id])
        .then(timeSlotsResult => {
          const timeSlots = timeSlotsResult.rows;

          db.query(responsesQuery, [event_id])
            .then(responsesResult => {
              const responses = responsesResult.rows;
              res.render('responses', { event, timeSlots, responses });
            })
            .catch(err => {
              console.error('Error fetching responses:', err);
              res.status(500).send('An error occurred while fetching responses.');
            });
        })
        .catch(err => {
          console.error('Error fetching time slots:', err);
          res.status(500).send('An error occurred while fetching time slots.');
        });
    })
    .catch(err => {
      console.error('Error fetching event:', err);
      res.status(500).send('An error occurred while fetching event details.');
    });
});

module.exports = router;