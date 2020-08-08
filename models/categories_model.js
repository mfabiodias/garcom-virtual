const db = require('../config/db');

const getCategories  = ()         => db('category');
const getCategory    = (id)       => db('category').where({id}).first();
const insertCategory = (data)     => db('category').insert(data);
const updateCategory = (id, data) => db('category').where({id}).update(data);
const deleteCategory = (id)       => db('category').where({id}).delete();

module.exports = { getCategories, getCategory, insertCategory, updateCategory, deleteCategory }

// async function teste() {
//     rtn = await db.raw('SELECT * FROM category');

//     console.log(rtn[0]);
// }

// teste();