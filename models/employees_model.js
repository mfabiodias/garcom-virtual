const db = require('../config/db');

const getEmployeesAddress = ()         => db('employee_address');
const getEmployeeAddress  = (id)       => db('employee_address').where({id}).first();
const getEmployees        = ()         => db('employee');
const getEmployee         = (id)       => db('employee').where({id}).first();
const insertEmployee      = (data)     => db('employee').insert(data);
const updateEmployee      = (id, data) => db('employee').where({id}).update(data);
const deleteEmployee      = (id)       => db('employee').where({id}).delete();

module.exports = { getEmployeesAddress, getEmployeeAddress, getEmployees, getEmployee, insertEmployee, updateEmployee, deleteEmployee }

