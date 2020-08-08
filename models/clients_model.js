const db = require('../config/db');

const getClients         = ()         => db('client');
const getClient          = (id)       => db('client').where({id}).first();
const getClientBy        = (prms)     => db('client').where(prms).first();
const getCampaignClients = (ids)      => db('client').whereIn('id', ids).whereNotNull('whatsapp_user');
const insertClient       = (data)     => db('client').insert(data);
const updateClient       = (id, data) => db('client').where({id}).update(data);
const deleteClient       = (id)       => db('client').where({id}).delete();

module.exports = { getClients, getClient, getClientBy, getCampaignClients, insertClient, updateClient, deleteClient }