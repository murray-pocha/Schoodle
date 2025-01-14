const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const e = require('express');

// Tiago start
let eventId;
// Tiago end

router.get('/new', (req, res) => {
  res.render('new-event');
});


router.post("/", (req, res) => {
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
    .then((result) => {
      const event = result.rows[0];
      // Tiago start
      eventId = event.id;

      const values_time_slot = [eventId, eventDate1, eventTime1, eventDate2, eventTime2];
      const query_time_slot = `
      INSERT INTO time_slots (event_id, date1, time1, date2, time2)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
      `;
      db.query(query_time_slot, values_time_slot)
        .then((result_time_slot) => {
          console.log("Tiago");
          console.log("Time Slot", result_time_slot);
          console.log("New Event Created:", event);
          res.redirect(`/events/event-details`);
        })
        .catch((err) => {
            console.error("Error saving event to database:", err.stack);
            res.status(500).send("An error occured while creating the event.");
        });
      // Tiago end
    })
    .catch((err) => {
      console.error("Error saving event to database:", err.stack);
      res.status(500).send("An error occured while creating the event.");
    });
});

// Tiago start
router.get('/event-details', (req, res) => {

  const query = `
  SELECT * FROM events
  WHERE id = $1;
  `;

  const values = [eventId];

  db.query(query, values)
    .then((result) => {
      const event = result.rows[0];

      console.log('Event Data:', event);
      if (!event) {
        return res.status(404).send('Event not found.');
      }
      const values_time_slot = [eventId];
      const query_time_slot = `
      SELECT * FROM time_slots
      WHERE event_id = $1;
      `;
      db.query(query_time_slot, values_time_slot)
        .then((result_time_slot) => {
          console.log("Time Slot", result_time_slot);
          const eventDetails = {
            title: event.title,
            description: event.description,
            date1: result_time_slot.rows[0].date1,
            time1: result_time_slot.rows[0].time1,
            date2: result_time_slot.rows[0].date2,
            time2: result_time_slot.rows[0].time2,
            secret_url: event.secret_url,
            organizer_name: event.organizer_name,
            organizer_email: event.organizer_email,
          }
          res.render('event-details', { eventDetails });
        })
        .catch((err) => {
            console.error("Time slots not found");
        });
    })
    .catch((err) => {
      console.error('Error fetching event from database:', err.stack);
      res.status(500).send('An error occured while fetching the event.');
    });
});
// Tiago end

router.get('/:event_id', (req, res) => {

  const { event_id } = req.params;
  const query = `
  SELECT * FROM events
  WHERE secret_url = $1;
  `;

  const values = [event_id]; // Secret URL

  db.query(query, values)
    .then((result) => {
      const event = result.rows[0];
      console.log('Event Data:', event);

      if (!event) {
        return res.status(404).send('Event not found.');
      }
      res.render('event-details', { event });
    })
    .catch((err) => {
      console.error('Error fetching event from database:', err.stack);
      res.status(500).send('An error occured while fetching the event.');
    });
});


module.exports = router;
