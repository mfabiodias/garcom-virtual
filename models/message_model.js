const db = require('../config/db');

const getMessages   = ()         => db('message');
const getMessage    = (id)       => db('message').where({id}).first();
const insertMessage = (data)     => db('message').insert(data);
const updateMessage = (id, data) => db('message').where({id}).update(data);
const deleteMessage = (id)       => db('message').where({id}).delete();

module.exports = { getMessages, getMessage, insertMessage, updateMessage, deleteMessage }