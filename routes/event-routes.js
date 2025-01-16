// event-routes.js
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
      const values_time_slot = [event.id, eventDate1, eventTime1, eventDate2, eventTime2];
      const query_time_slot = `
        INSERT INTO time_slots (event_id, date1, time1, date2, time2)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;

      return db.query(query_time_slot, values_time_slot).then(() => {
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

  const query = `
    SELECT * FROM events WHERE id = $1;
  `;
  const values = [eventId];

  db.query(query, values)
    .then(result => {
      const event = result.rows[0];

      if (!event) {
        return res.status(404).send('Event not found.');
      }

      const query_time_slot = `
        SELECT * FROM time_slots WHERE event_id = $1;
      `;
      db.query(query_time_slot, [eventId])
        .then(result_time_slot => {
          const timeSlots = result_time_slot.rows;
          const eventDetails = {
            title: event.title,
            description: event.description,
            date1: timeSlots[0].date1,
            time1: timeSlots[0].time1,
            date2: timeSlots[0].date2,
            time2: timeSlots[0].time2,
            secret_url: event.secret_url,
            organizer_name: event.organizer_name,
            organizer_email: event.organizer_email,
          };
          res.render('event-details', { eventDetails });
        })
        .catch(err => {
          console.error('Error fetching time slots:', err);
          res.status(500).send('Error fetching time slots.');
        });
    })
    .catch(err => {
      console.error('Error fetching event from database:', err.stack);
      res.status(500).send('An error occurred while fetching the event.');
    });
});


router.get('/:event_id/attendees/new', (req, res) => {
  const { event_id } = req.params;

  const eventQuery = `
  SELECT * FROM events
  WHERE secret_url = $1;
  `;

  const timeSlotsQuery = `
  SELECT id, date1 AS date, time1 AS time
  FROM time_slots
  WHERE event_id::text = $1;
  `;

  db.query(eventQuery, [event_id])
    .then(eventResult => {
      const event = eventResult.rows[0];

      if (!event) {
        return res.status(404).send('Event not found.');
      }

      console.log('Event found:', event);

      db.query(timeSlotsQuery, [event.id])
        .then(timeSlotsResult => {
          console.log('time slots:', timeSlotsResult.rows);
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


router.post('/:event_id/attendees', (req, res) => {
  console.log('Form submission received:', req.body);
  const { event_id } = req.params;
  const { name, email, ...availability } = req.body;

  if (!name || !email) {
    return res.status(400).send('Name and email are required.');
  }

  const attendeeQuery = `
  INSERT INTO attendees (event_id, name, email)
  VALUES ($1, $2, $3)
  RETURNING id;
  `;

  const attendeeValues = [event_id, name, email];

  db.query(attendeeQuery, attendeeValues)
    .then(attendeeResult => {
      const attendeeId = attendeeResult.rows[0].id;

      const responseValues = Object.entries(availability)
        .filter(([Key, value]) => Key.startsWith('availability_'))
        .map(([key, value]) => {
          const timeSlotId = key.split('_')[1];
          return `(${attendeeId}, ${event_id}, ${timeSlotId}, CURRENT_TIMESTAMP)`;
        })
        .join(', ');

      if (!responseValues) {
        return res.status(400).send('No availability data provided.');
      }

      const responseQuery = `
    INSERT INTO responses (attendee_id, event_id, time_slot_id, updated_at)
    VALUES ${responseValues};
    `;

      return db.query(responseQuery);
    })
    .then(() => {
      res.redirect(`/events/${event_id}/responses`);
    })
    .catch(err => {
      console.error('Error saving attendee or responses:', err);
      res.status(500).send('An error occured while saving your response.');
    });
});

router.get('/:event_id/responses', (req, res) => {
  const { event_id } = req.params;

  const eventQuery = `
    SELECT * FROM events WHERE id = $1;
  `;

  const responsesQuery = `
    SELECT 
    attendees.name AS attendee_name, 
    attendees.email AS attendee_email, 
    time_slots.date AS date, 
    time_slots.time AS time, 
    responses.updated_at AS response_time
  FROM responses
  JOIN attendees ON responses.attendee_id = attendees.id
  JOIN time_slots ON responses.time_slot_id = time_slots.id
  WHERE responses.event_id = $1;
  `;

  // Fetch event details
  db.query(eventQuery, [event_id])
    .then(eventResult => {
      const event = eventResult.rows[0];

      if (!event) {
        return res.status(404).send('Event not found.');
      }

      // Fetch responses for the event
      db.query(responsesQuery, [event_id])
        .then(responsesResult => {
          const responses = responsesResult.rows;

          // Render the responses view
          res.render('responses', { event, responses });
        })
        .catch(err => {
          console.error('Error fetching responses:', err);
          res.status(500).send('An error occurred while fetching responses.');
        });
    })
    .catch(err => {
      console.error('Error fetching event:', err);
      res.status(500).send('An error occurred while fetching event details.');
    });
});

module.exports = router;
