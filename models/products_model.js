const db = require('../config/db');

const getProducts    = ()            => db('product');
const getProduct     = (id)          => db('product').where({id}).first();
const insertProduct  = (data)        => db('product').insert(data);
const updateProduct  = (id, data)    => db('product').where({id}).update(data);
const deleteProduct  = (id)          => db('product').where({id}).delete();
const hasManyProduct = (category_id) => db('product').where(category_id).count('* AS product_qty').first();

module.exports = { getProducts, getProduct, insertProduct, updateProduct, deleteProduct, hasManyProduct }


// async function teste(){
//     const products = await hasManyProduct(4);

//     console.log(products);
// }

// teste();