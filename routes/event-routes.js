const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const e = require('express');
const { getEventById, getTimeslotsByEventId, createAttendee, createResponsesForAttendee, getResponsesByEventId } = require("../db/queries/events")

// Tiago start
let eventId;
// Tiago end

router.get('/new', (req, res) => {
  res.render('new-event');
});


router.post("/", (req, res) => {
  console.log('Request body:', req.body);
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

router.get('/:event_id/attendees/new', (req, res) => {
  const _eventId = req.params.event_id
  getEventById(_eventId)
    .then((events) => {
      getTimeslotsByEventId(_eventId)
        .then((timeSlots) => {
          res.render("attendee", { timeSlots, event: events[0], route: _eventId })
        })
        .catch((e) => {
          res.status(500).send(e)
        })
    })
    .catch((e) => {
      res.status(403).send("Event not found")
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

router.get('/:event_id/responses', async (req, res) => {
  const { event_id } = req.params;

  try {
    const event = await getEventById(event_id);
    const responses = await getResponsesByEventId(event_id);
    const timeSlots = await getTimeslotsByEventId(event_id);

    // const availabilitySummary = responses.reduce((summary, response) => {
    //   const { slot_id, response: attendeeResponse } = response;
    //   if (!summary[slot_id]) {
    //     summary[slot_id] = { yes: 0, no: 0 };
    //   }
    //   summary[slot_id][attendeeResponse]++;
    //   return summary;
    // }, {});
    
    // const attendees = Object.values(responses.reduce(((accum, curr) => {
    //   if (!(curr.attendee_id in accum)) {
    //       accum[curr.attendee_id] = curr;
    //   }
    //   return accum;
    // }), {}))

    // const timeSlots = Object.values(responses.reduce((accum, curr) => {
    //   if (!(curr.time_slot_id in accum)) {
    //     accum[curr.slot_id] = {...curr, count: 1};
    //   } else {
    //     accum[curr.slot_id].count = accum[curr.slot_id].count + 1;
    //   }
    //   return accum;
    // }, {})).map((timeSlot) => {
    //     return {
    //       ...timeSlot,
    //       yes: timeSlot.count,
    //       no: attendees.length - timeSlot.count
    //     }
    // })

    // const timeSlots = Object.values(responses.reduce((accum, curr) => {
    //   accum[curr.time_slot_id] = curr
    //   return accum;
    // }, {}))
    const selectedTimeSlots = {}

    const attendees = Object.values(responses.reduce((accum, curr) => {
      if (!(curr.attendee_id in accum)) {
        accum[curr.attendee_id] = curr;
      }
      return accum;
    }, {}))

    for (const response of attendees) {
      selectedTimeSlots[response.attendee_id] = {}
      for (const timeSlot of timeSlots) {

        if (responses.filter(r => r.attendee_id === response.attendee_id && r.time_slot_id === timeSlot.id).length > 0) {
          selectedTimeSlots[response.attendee_id][timeSlot.id] = true
        } else {
          selectedTimeSlots[response.attendee_id][timeSlot.id] = false
        }
      }
    }
    // console.log("Time Slots", timeSlots)
    res.render('responses', { event, responses, timeSlots, selectedTimeSlots, attendees });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).send('An error occurred while fetching responses.');
  }
});

router.put('/events/:event_id/attendees/:attendee_id/responses', async (req, res) => {
  const { event_id, attendee_id } = req.params;
  const { availability } = req.body; // Expected format: { slotId: "yes" | "no", ... }

  try {
    if (!availability || typeof availability !== 'object') {
      return res.status(400).json({ error: 'Invalid availability data.' });
    }

    const updates = Object.entries(availability).map(([slotId, response]) => ({
      attendee_id,
      slot_id: parseInt(slotId, 10),
      response,
    }));

    await db.updateAttendeeResponses(updates);

    res.json({
      message: 'Responses updated successfully.',
      attendeeId: attendee_id,
      eventId: event_id,
      updatedResponses: availability,
    });
  } catch (error) {
    console.error('Error updating responses:', error);
    res.status(500).send('An error occurred while updating responses.');
  }
});

module.exports = router;
