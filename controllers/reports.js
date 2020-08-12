const helper = require('../helpers');
const model  = require('../models');
const config = require('../config/config');
const date   = helper.date(new Date, 'yyyy-mm-dd').toString();
const month  = helper.date(new Date, 'mm').toString();

async function getReport(res, req, type)  {   

    let business = await model.getBusiness();
    business = business[0][0];

    let report = await model.getReport();
    report = report[0][0];
    
    let attr = {
        user: business.name,
        page: "Relatório",
        table: "",
        belongsto: "",
        title: `Relatórios | ${business.name}`,
        business : {
            name: config.app.name,
            since: config.app.since, 
            link: config.app.link
        }
    }; 

    const daily   = reportDaily(report);
    const payment  = reportPayment(report);
    const product  = await reportProduct(report);
    const delivery = await reportDelivery(report);

    res.render('./pages/admin/report', { attr, business, report: { daily, product, payment, delivery } });
}

const reportDaily = (report) => {

    const daily = { receita: 0, item: 0, pedido : 0, ticket: 0 };
    let order = !!report && !!report.order ? report.order : null;

    try {
        if(!!order) order = JSON.parse(order);
        else order = {};
    } catch (error) {
        order = null;
    }

    if(!!order && !!order[date]) 
    {
        // Data
        daily.receita = parseFloat(order[date].retirar.cost) + parseFloat(order[date].consumir.cost) + parseFloat(order[date].entregar.cost);
        daily.item    = parseInt(order[date].retirar.qty) + parseInt(order[date].consumir.qty) + parseInt(order[date].entregar.qty);;
        daily.pedido  = order[date].pedido .qty;
        daily.ticket  = daily.receita / parseFloat(daily.item);
        
        // Format
        daily.receita = helper.number_format(daily.receita.toFixed(2), 2, ',', '.');
        daily.ticket  = helper.number_format(daily.ticket.toFixed(2), 2, ',', '.');
    }

    return daily;
}

const reportPayment = (report) => {

    const dateWeek = helper.date(helper.addDays(new Date, -Math.abs(report.week)), 'yyyy-mm-dd').toString();

    const payment = { 
        day   : { type: [["Método", "R$ ", { role: "style" } ]], origin: [["Método", "R$ ", { role: "style" } ]] },
        week  : { type: [["Método", "R$ ", { role: "style" } ]], origin: [["Método", "R$ ", { role: "style" } ]] },
        month : { type: [["Método", "R$ ", { role: "style" } ]], origin: [["Método", "R$ ", { role: "style" } ]] },
    };

    let obj = !!report && !!report.payment ? report.payment : null;

    try {
        if(!!obj) obj = JSON.parse(obj);
        else obj = {};
    } catch (error) {
        obj = null;
    }

    let objDay   = [];
    let objWeek  = [];
    let objMonth = [];

    Object.entries(obj).forEach(el => {
        if(el[0] == date) {
            objDay.push(JSON.parse(`{"${el[0]}": ${JSON.stringify(el[1])}}`));
        }

        if(el[0] >= dateWeek && el[0] <= date) {
            objWeek.push(JSON.parse(`{"${el[0]}": ${JSON.stringify(el[1])}}`));
        }

        if(month == helper.date(el[0], 'mm').toString()) {
            objMonth.push(JSON.parse(`{"${el[0]}": ${JSON.stringify(el[1])}}`));
        }
    });

    // Preenche os dados
    if(!!objDay.length) { calcPaymentAmount(objDay, payment.day) }
    if(!!objWeek.length) { calcPaymentAmount(objWeek, payment.week) }
    if(!!objMonth.length) { calcPaymentAmount(objMonth, payment.month) }
    
    return payment;
}

const reportProduct = async (report) => {

    const dateWeek = helper.date(helper.addDays(new Date, -Math.abs(report.week)), 'yyyy-mm-dd').toString();

    const product = { 
        day   : { visited: [['Visitas', 'Visualização por Dia']], sold: [['Vendas', 'Vendas por Dia']] },
        week  : { visited: [['Visitas', 'Visualização por Dia']], sold: [['Vendas', 'Vendas por Dia']] },
        month : { visited: [['Visitas', 'Visualização por Dia']], sold: [['Vendas', 'Vendas por Dia']] },
    };

    const items = await model.getProducts();

    let obj = !!report && !!report.product ? report.product : null;

    try {
        if(!!obj) obj = JSON.parse(obj);
        else obj = {};
    } catch (error) {
        obj = null;
    }

    let objDay   = [];
    let objWeek  = [];
    let objMonth = [];

    Object.entries(obj).forEach(el => {
        if(el[0] == date) {
            objDay.push(JSON.parse(`{"${el[0]}": ${JSON.stringify(el[1])}}`));
        }

        if(el[0] >= dateWeek && el[0] <= date) {
            objWeek.push(JSON.parse(`{"${el[0]}": ${JSON.stringify(el[1])}}`));
        }

        if(month == helper.date(el[0], 'mm').toString()) {
            objMonth.push(JSON.parse(`{"${el[0]}": ${JSON.stringify(el[1])}}`));
        }
    });
    
    // Preenche os dados
    if(!!objDay.length) { calcProductAmount(items, objDay, product.day) }
    if(!!objWeek.length) { calcProductAmount(items, objWeek, product.week) }
    if(!!objMonth.length) { calcProductAmount(items, objMonth, product.month) }
    
    return product;
}

const reportDelivery = async (report) => {

    const dateWeek = helper.date(helper.addDays(new Date, -Math.abs(report.week)), 'yyyy-mm-dd').toString();

    const delivery = { 
        day   : { cost: [["Funcionário", "R$ ", { role: "style" } ]], qty: [["Funcionário", "R$ ", { role: "style" } ]] },
        week  : { cost: [["Funcionário", "R$ ", { role: "style" } ]], qty: [["Funcionário", "R$ ", { role: "style" } ]] },
        month : { cost: [["Funcionário", "R$ ", { role: "style" } ]], qty: [["Funcionário", "R$ ", { role: "style" } ]] },
    };

    const employees = await model.getEmployees();

    let obj = !!report && !!report.delivery ? report.delivery : null;

    try {
        if(!!obj) obj = JSON.parse(obj);
        else obj = {};
    } catch (error) {
        obj = null;
    }

    let objDay   = [];
    let objWeek  = [];
    let objMonth = [];

    Object.entries(obj).forEach(el => {
        if(el[0] == date) {
            objDay.push(JSON.parse(`{"${el[0]}": ${JSON.stringify(el[1])}}`));
        }

        if(el[0] >= dateWeek && el[0] <= date) {
            objWeek.push(JSON.parse(`{"${el[0]}": ${JSON.stringify(el[1])}}`));
        }

        if(month == helper.date(el[0], 'mm').toString()) {
            objMonth.push(JSON.parse(`{"${el[0]}": ${JSON.stringify(el[1])}}`));
        }
    });

    // Preenche os dados
    // if(!!objDay.length) { calcDeliveryAmount(employees, objDay, delivery.day) }
    // if(!!objWeek.length) { calcDeliveryAmount(employees, objWeek, delivery.week) }
    if(!!objMonth.length) { calcDeliveryAmount(employees, objMonth, delivery.month) }
    
    return delivery;
}

const mySort = function(obj) {
    let entries = Object.entries(obj);
    return entries.sort((a, b) => a[1] - b[1]);
}

const myAsort = function(obj) {
    let entries = Object.entries(obj);
    return entries.sort((a, b) => b[1] - a[1]);
}

const calcPaymentAmount = function(obj, save)
{
    let type   = {} 
    let origin = {};

    const hexColors = ["#7DA2EE", "#D7A442", "#95B871", "#636AB8"] 

    obj.forEach((elm) => {
        Object.entries(elm).forEach(el => {
            Object.entries(el[1].origin).forEach(e => {
                if(!origin[e[0]]) { origin[e[0]] = 0 }
                origin[e[0]] += parseFloat(e[1].cost);
                origin[e[0]] = parseFloat(origin[e[0]].toFixed(2));
            });
            Object.entries(el[1].type).forEach(e => {
                if(!type[e[0]]) { type[e[0]] = 0 }
                type[e[0]] += parseFloat(e[1].cost);
                type[e[0]] = parseFloat(type[e[0]].toFixed(2));
            });
        });
    });

    Object.entries(origin).forEach((el, idx) => {
        save.origin.push([ el[0], el[1], hexColors[idx] ]) 
    });
    
    Object.entries(type).forEach((el, idx) => {
        save.type.push([ el[0], el[1], hexColors[idx] ])
    });
}


const calcDeliveryAmount = function(employees, obj, save)
{
    let qty  = {};
    let cost = {};

    const hexColors = ["#7DA2EE", "#D7A442", "#95B871", "#636AB8"] 

    obj.forEach((elm) => {
        Object.entries(elm).forEach(el => {
            Object.entries(el[1]).forEach(e => {
                if(!qty[e[0]]) { qty[e[0]] = 0 }
                qty[e[0]] += parseInt(e[1].qty);

                if(!cost[e[0]]) { cost[e[0]] = 0 }
                cost[e[0]] += parseFloat(e[1].cost);
                cost[e[0]] = parseFloat(cost[e[0]].toFixed(2));
            });
        });
    });

    Object.entries(qty).forEach((el, idx) => {
        save.qty.push([ employeeName(employees, el[0]), el[1], hexColors[idx] ]) 
    });
    
    Object.entries(cost).forEach((el, idx) => {
        save.cost.push([ employeeName(employees, el[0]), el[1], hexColors[idx] ]) 
    });
}

const employeeName = function(employees, el)
{
    emp = employees.find(e => e.id == el);
    
    if(!!emp) {
        return emp.name;
    }
    else {
        return "Outros";
    }
}

const calcProductAmount = function(items, obj, save)
{
    let sold    = {} // whatsapp mesa website telefone
    let visited = {};

    obj.forEach((elm) => {
        Object.entries(elm).forEach(el => {
            Object.entries(el[1].visited).forEach(e => {
                if(!visited[e[0]]) { visited[e[0]] = 0 }
                visited[e[0]] += parseInt(e[1].qty);
            });
            Object.entries(el[1].sold.whatsapp).forEach(e => {
                if(!sold[e[0]]) { sold[e[0]] = 0 }
                sold[e[0]] += parseInt(e[1].qty);
            });
            Object.entries(el[1].sold.mesa).forEach(e => {
                if(!sold[e[0]]) { sold[e[0]] = 0 }
                sold[e[0]] += parseInt(e[1].qty);
            });
            Object.entries(el[1].sold.website).forEach(e => {
                if(!sold[e[0]]) { sold[e[0]] = 0 }
                sold[e[0]] += parseInt(e[1].qty);
            });
            Object.entries(el[1].sold.telefone).forEach(e => {
                if(!sold[e[0]]) { sold[e[0]] = 0 }
                sold[e[0]] += parseInt(e[1].qty);
            });
        });
    });

    visited = myAsort(visited).slice(0,5);
    visited.forEach(el => {
        data = items.find(it => it.id == el[0]);
        if(!!data) { save.visited.push([ data.name, el[1] ]) }
    });
    
    sold = myAsort(sold).slice(0,5);
    sold.forEach(el => {
        data = items.find(it => it.id == el[0]);
        if(!!data) { save.sold.push([ data.name, el[1] ]) }
    });
}

module.exports = { 
    getReport
} 