const db = require('../config/db');

// 0 = Monday, 1 = Tuesday, 2 = Wednesday, 3 = Thursday, 4 = Friday, 5 = Saturday, 6 = Sunday

const sql1 = `
    SELECT r.id, r.product, r.payment, r.order, r.delivery, WEEKDAY(NOW()) AS 'week' 
    FROM report r
    WHERE r.id = 'gestor' 
`;

const getReport    = ()     => db.raw(sql1);
const updateReport = (data) => db('report').where({id : "gestor"}).update(data);

module.exports = { getReport, updateReport }


// const prod = async () => {
//     rtn = await getReport();

//     console.log(rtn[0][0]);
// }

// prod();