const db = require('../config/db');

const getAdresses     = ()           => db('address');
const getAddress      = (id)         => db('address').where({id}).first();
const getAddressBy    = (prms)       => db('address').where(prms).first();
const getAddressAll   = (prms)       => db('address').where(prms)
const insertAddress   = (data)       => db('address').insert(data);
const updateAddress   = (id, data)   => db('address').where({id}).update(data);
const updateAddressBy = (prms, data) => db('address').where(prms).update(data);
const deleteAddress   = (id)         => db('address').where({id}).delete();
const deleteAddressBy = (prms)       => db('address').where(prms).delete();

module.exports = { 
    getAdresses, getAddressBy, getAddressAll,getAddress, insertAddress, 
    updateAddress, updateAddressBy, deleteAddress, deleteAddressBy 
}