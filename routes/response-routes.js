const express = require('express');
const router  = express.Router();
const { getEventById, getTimeslotsByEventId } = require("../db/queries/events")

