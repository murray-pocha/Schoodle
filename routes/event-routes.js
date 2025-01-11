const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const mockEvents = {}; //temporary in-memory store for events(replace with database query later)

router.get('/new', (req,res) => {
  res.render('new-event');
});


router.post("/", (req, res) => {
  const { title, description, name, email } = req.body;
  if(!title || !description || !name || !email) {
    return res.status(400).send('All fields are required.');
  }
  const eventId = uuidv4();
  
  mockEvents[eventId] = { //adjusted to accept mockEvents
    id: eventId,
    title,
    description,
    organizerName: name,
    organizerEmail: email,
  };
  console.log('New Event Created:', mockEvents[eventId]); //adjusted to accept mock events needs to go back to newEvent after
  res.redirect(`/events/${eventId}`);
});


router.get('/:event_id', (req,res) => {
const { event_id } = req.params;

const event = mockEvents[event_id];
if (!event) {
  return res.status(404).send('Event not found.');
}
res.render('event-details', { event });
})









module.exports = router;