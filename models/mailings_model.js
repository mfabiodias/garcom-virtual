const db = require('../config/db');

const getMailings   = ()         => db('mailing');
const getMailing    = (id)       => db('mailing').where({id}).first();
const insertMailing = (data)     => db('mailing').insert(data);
const updateMailing = (id, data) => db('mailing').where({id}).update(data);
const deleteMailing = (id)       => db('mailing').where({id}).delete();

module.exports = { getMailings, getMailing, insertMailing, updateMailing, deleteMailing }