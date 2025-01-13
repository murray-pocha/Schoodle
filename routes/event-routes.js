const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const e = require('express');


router.get('/new', (req, res) => {
  res.render('new-event');
});


router.post("/", (req, res) => {
  const { title, description, name, email } = req.body;

  if (!title || !description || !name || !email) {
    return res.status(400).send('All fields are required.');
  }
  const eventId = uuidv4();
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
      console.log("New Event Created:", event);
      res.redirect(`/events/${event.secret_url}`);
    })
    .catch((err) => {
      console.error("Error saving event to database:", err.stack);
      res.status(500).send("An error occured while creating the event.");
    });
});


router.get('/:event_id', (req, res) => {
  const { event_id } = req.params;
  const query = `
 SELECT * FROM events
 WHERE secret_url = $1;
 `;

  const values = [event_id];

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