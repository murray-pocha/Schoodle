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
    
    console.log("responses======>\n", respones)
    const query = {
        text: `INSERT INTO responses(event_id, time_slot_id, attendee_id) VALUES ${respones}`
    }
    return db.query(query).then((res) => {
        return res.rows[0]
    })
};


module.exports = { getEventById, getTimeslotsByEventId, createAttendee, createResponsesForAttendee };
