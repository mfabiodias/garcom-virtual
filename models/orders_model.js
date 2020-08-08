const db = require('../config/db');

const getOrders    = ()           => db('order');
const getOrdersBy  = (prms)       => db('order').where(prms).orderBy('id', 'desc');
const getOrder     = (id)         => db('order').where({id}).first();
const insertOrder  = (data)       => db('order').insert(data);
const updateOrder  = (id, data)   => db('order').where({id}).update(data);
const deleteOrder  = (id)         => db('order').where({id}).delete();
const hasManyOrder = (foreign_id) => db('order').where(foreign_id).count('* AS order_qty').first();

module.exports = { getOrders, getOrdersBy, getOrder, insertOrder, updateOrder, deleteOrder, hasManyOrder }


// data = {
//     client_id: 1,
//     employee_id: 1,
//     items: JSON.stringify([
//         {id:1, qty:2, price:17.9 },
//         {id:19, qty:1, price:6 }, 
//     ]),
//     delivery: 2
// }
// example(data);


// async function example(data){
//     const ins = await insertOrder(data);
//     console.log(ins);
// }

// async function example2(){
//     const rtn = await getOrdersBy();
//     console.log(rtn);
// }

// example2()