const db = require('../config/db');

const getReport    = ()     => db('report').where({id : "gestor"}).first();
const updateReport = (data) => db('report').where({id : "gestor"}).update(data);

module.exports = { getReport, updateReport }


// const prod = async () => {
//     rtn = await getReport();

//     console.log(rtn);
// }

// prod()