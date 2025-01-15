const express = require('express');
const router = express.Router();
const { getEventById, getTimeslotsByEventId, createAttendee, createResponsesForAttendee } = require("../db/queries/events")

router.get('/:event_id/attendees/new', (req, res) => {
  const eventId = req.params.event_id
  getEventById(eventId)
    .then((events) => {


      getTimeslotsByEventId(eventId)
        .then((timeSlots) => {
          res.render("attendee", { timeSlots, event: events[0] })
        })
        .catch((e) => {
          res.status(500).send(e)
        })
    })
    .catch((e) => {
      res.status(500).send(e)
    })
});

router.post('/:event_id/attendees', (req, res) => {
  const { event_id } = req.params;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const selectedSlots = Object.fromEntries(Object.entries(req.body).filter(([key, value]) => {
    return key.startsWith("availability_") && value === "yes"
  }))

  createAttendee({ eventId: event_id, name, email }).then((attendee) => {

    const respones = Object.entries(selectedSlots)
      .map(([key, value]) => {
        const slotId = key.split("_")[1]
        return `(${event_id}, ${slotId}, ${attendee.id})`
      }).join(', ')

    createResponsesForAttendee(respones).then(() => {
      res.render('attendee-response', { name: attendee.name, email: attendee.email })
    })
  })
});

module.exports = router;
