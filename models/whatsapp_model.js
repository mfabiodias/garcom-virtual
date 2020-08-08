const db = require('../config/db');

const getWhatsapp    = (id)       => db('whatsapp').where({id}).first();
const updateWhatsapp = (id, data) => db('whatsapp').where({id}).update(data);

module.exports = { getWhatsapp, updateWhatsapp }