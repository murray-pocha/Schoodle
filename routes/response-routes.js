const express = require('express');
const router  = express.Router();
const { getEventById, getTimeslotsByEventId } = require("../db/queries/events")

router.get('/:event_id/responses', async (req, res) => {
    const { event_id } = req.params;
  
    try {
      const event = await db.getEventById(event_id);
  
      const responses = await db.getResponsesByEventId(event_id);
  
      const availabilitySummary = responses.reduce((summary, response) => {
        const { slot_id, response: attendeeResponse } = response;
        if (!summary[slot_id]) {
          summary[slot_id] = { yes: 0, no: 0 };
        }
        summary[slot_id][attendeeResponse]++;
        return summary;
      }, {});
  
      res.render('event_responses', { event, responses, availabilitySummary });
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
