const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');

async function getEmployees(res, req, type) { 

    const employees = await model.getEmployeesAddress();

    let business = await model.getBusiness();
    business = business[0][0];
    
    const attr = {
        user: business.name,
        logo: "",
        page: "Funcionário",
        table: "employee",
        belongsto: "",
        title: `Funcionário | ${business.name}`,
        business : {
            name: config.app.name,
            since: config.app.since
        }
    };
    
    if(!!type && type == 'admin') res.render('./pages/admin/employee', { rows:employees, helper, attr, business });
    else res.json(employees);
}

async function getEmployee(res, parId) { 

    const employee = await model.getEmployeeAddress(parId);

    res.json(employee);
}

async function updateEmployee(res, parId, data) { 

    const employee_data = mountEmployee(data);
    const address_data  = mountAddress(data);

    const rtn = { success: 0, msg: "" };

    if(!!employee_data.name) 
    {
        if(!!employee_data.mobile) {
            employee_data.mobile = helper.number_only(employee_data.mobile);
        }
        if(!!employee_data.phone) {
            employee_data.phone = helper.number_only(employee_data.phone);
        }

        const employee_updated = await model.updateEmployee(parId, employee_data);
        const employee = await model.getEmployee(parId);

        if(!!employee_updated) 
        {
            address_data.employee_id = parId;

            if(!!address_data.zip && address_data.zip.length == 8 && !!address_data.street)
            {
                const address = await model.getAddress(parId);

                if(!!address.id)
                {
                    const address_id = await model.updateAddressBy({employee_id: parId}, address_data);
    
                    if(!!address_id) 
                    {
                        rtn.id = employee.id;
                        rtn.success = 1;
                        rtn.msg = "Funcionário atualizado com sucesso!";
                    }
                    else 
                    {
                        rtn.id = employee.id;
                        rtn.success = 1;
                        rtn.msg = "Funcionário atualizado com sucesso, mas não conseguimos atualizar o endereço!";
                    }
                }
                else 
                {
                    const address_id = await model.insertAddress(address_data);
    
                    if(!!address_id) 
                    {
                        rtn.id = employee.id;
                        rtn.success = 1;
                        rtn.msg = "Funcionário atualizado com sucesso!";
                    }
                    else 
                    {
                        rtn.id = employee.id;
                        rtn.success = 1;
                        rtn.msg = "Funcionário atualizado com sucesso, mas não conseguimos cadastrar o endereço!";
                    }
                }
            }
            else 
            {
                rtn.id = employee.id;
                rtn.success = 1;
                rtn.msg = "Funcionário atualizado com sucesso, mas seu endereço está inválido!";
            }
        }
        else 
        {
            rtn.success = 0;
            rtn.msg = "Problemas ao atualizar funcionário. Tente novamente e persisitindo o erro contate o administrador.";
        }
    }
    else 
    {
        rtn.success = 0;
        rtn.msg = "Problemas ao atualizar funcionário. Nome do funcionário deve ser informado!";
    }

    res.json(rtn);

}

async function insertEmployee(res, data) { 

    const employee_data = mountEmployee(data);
    const address_data  = mountAddress(data);

    const rtn = { success: 0, msg: "" };
    
    if(!!employee_data.name) 
    {
        if(!!employee_data.mobile) {
            employee_data.mobile = helper.number_only(employee_data.mobile);
        }
        if(!!employee_data.phone) {
            employee_data.phone = helper.number_only(employee_data.phone);
        }

        const insertId = await model.insertEmployee(employee_data);
        const employee = await model.getEmployee(insertId);

        if(!!employee.id) 
        {
            address_data.employee_id = employee.id;

            if(!!address_data.zip && address_data.zip.length == 8 && !!address_data.street)
            {
                const address_id = await model.insertAddress(address_data);

                if(!!address_id) 
                {
                    rtn.id = employee.id;
                    rtn.success = 1;
                    rtn.msg = "Funcionário cadastrado com sucesso!";
                }
                else 
                {
                    rtn.id = employee.id;
                    rtn.success = 1;
                    rtn.msg = "Funcionário cadastrado com sucesso, mas não conseguimos cadastrar o endereço!";
                }
            }
            else 
            {
                rtn.id = employee.id;
                rtn.success = 1;
                rtn.msg = "Funcionário cadastrado com sucesso, mas seu endereço está inválido!";
            }
        }
        else 
        {
            rtn.success = 0;
            rtn.msg = "Problemas ao cadastrar funcionário. Tente novamente e persisitindo o erro contate o administrador.";
        }
    }
    else 
    {
        rtn.success = 0;
        rtn.msg = "Problemas ao cadastrar funcionário. Nome do funcionário deve ser informado!";
    }

    res.json(rtn);
}

async function deleteEmployee(res, parId) { 

    const { order_qty } = await model.hasManyOrder({employee_id:parId});

    let success;
    let message;
    if(order_qty > 0)
    {
        success = false
        message = `Funcionário com SKU: ${helper.str_pad(parId, 3, "0", "left", "F")} tem ${order_qty} pedido(s) vinculado(s) e não pode ser excluído`;
    }
    else
    {
        await model.deleteAddressBy({employee_id:parId});
        const qtyDeleted = await model.deleteEmployee(parId);

        success = qtyDeleted > 0 ? true : false
        message = qtyDeleted > 0 ? 'Excluído com sucesso!' : `Funcionário com ID: ${parId} não foi deletado`;
    }
    
    res.json({success, message});
}

function mountEmployee(data) 
{
    return  { 
        name:         !!data.name ? data.name : "",
        mobile:       !!data.mobile ? data.mobile.replace(/[^0-9]/g,'') : "",
        phone:        !!data.phone ? data.phone.replace(/[^0-9]/g,'') : ""
    };
}

function mountAddress(data) 
{
    return  { 
        zip:          !!data.zip ? data.zip.replace(/[^0-9]/g,'') : "",
        street:       !!data.street ? data.street : "",
        number:       !!data.number ? data.number : "",
        complement:   !!data.complement ? data.complement : "",
        reference:    !!data.reference ? data.reference : "",
        neighborhood: !!data.neighborhood ? data.neighborhood : "",
        city:         !!data.city ? data.city : "",
        state:        !!data.state ? data.state : ""
    };
}

module.exports = { getEmployees, getEmployee, updateEmployee, insertEmployee, deleteEmployee }