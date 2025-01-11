const express = require('express');
const router = express.Router();

const mockTimeSlots = {}; //temp time slot storage, replace with database query to manage 'time_slots' table

router.post('/:event_id/timeslots', (req, res) => {
  const { event_id } = req.params;
  const { startTime, endTime } = req.body;

  if (!startTime || !endTime) {
    return res.status(400).send('Start and end times are required.');
  }
  if (!mockTimeSlots[event_id]) { // ensure time slot array exists for the event in mock data, replace later with databse query to fetch existing time slots for the event
    mockTimeSlots[event_id] = [];
  }

  const newTimeSlot = { startTime, endTime };
  mockTimeSlots[event_id].push(newTimeSlot); // adds new timeslot to temp in memory data, replace later with database query to insert new time slot into the 'time_slots' table

  console.log(`Time slot added to event ${event_id}:`, newTimeSlot);

  res.status(201).send({ message: 'Time slot added.', timeSlots: mockTimeSlots[event_id]});
})

module.exports = router;