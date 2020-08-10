const db = require('../config/db');

const sql1 = `
    SELECT b.id, b.name, b.image, b.mobile, b.user, b.pass, b.payment_money, b.payment_credit, 
        b.payment_debit, b.payment_voucher, b.order_consume, b.order_retire, b.order_deliver, 
        b.order_tax, b.printer_size, b.delivery_type, b.delivery_cost, b.delivery_limite, 
        b.tables, b.wait, b.open, a.zip, a.street, a.number, a.complement, a.reference, 
        a.neighborhood, a.city, a.state, WEEKDAY(NOW()) AS weekday 
    FROM business b 
    LEFT JOIN address a ON (a.business_id = b.id) 
    WHERE b.id = 1 
`;

const getBusiness    = ()     => db.raw(sql1);
const updateBusiness = (data) => db('business').where({id : 1}).update(data);

module.exports = { getBusiness, updateBusiness }

// start = () => {
//     getBusiness()
//     .then(res => console.log(res[0][0]))
// }

// start();