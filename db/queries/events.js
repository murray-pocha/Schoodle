const db = require('../connection');

const getEventById = (eventId) => {
    return db.query(`SELECT * FROM events WHERE id = ${eventId};`)
        .then((data) => {
            return data.rows
        })
};

const getTimeslotsByEventId = (eventId) => {
    return db.query(`SELECT * FROM time_slots WHERE event_id = ${eventId}`).then((data) => {
        return data.rows
    })
};



const createAttendee = ({email, eventId, name}) => {
    const query = {
        text: 'INSERT INTO attendees(event_id, name, email) VALUES($1, $2, $3) ON CONFLICT (event_id, email) DO UPDATE SET name = EXCLUDED.name RETURNING *',
        values: [eventId, name, email]
    }
    return db.query(query).then((res) => {
        return res.rows[0]
    })
};


const createResponsesForAttendee = (respones) => {
    const query = {
        text: `INSERT INTO responses(event_id, time_slot_id, attendee_id) VALUES ${respones}`
    }
    return db.query(query).then((res) => {
        return res.rows[0]
    })
}

const getResponsesByEventId = (eventId) => {
    return db.query(`SELECT * FROM responses 
                    INNER JOIN time_slots ON time_slots.id = responses.time_slot_id 
                    INNER JOIN attendees ON attendees.id = responses.attendee_id
                    WHERE responses.event_id = ${eventId};`)
        .then((data) => {
            return data.rows
        })
};


module.exports = { getEventById, getTimeslotsByEventId, createAttendee, createResponsesForAttendee, getResponsesByEventId };
