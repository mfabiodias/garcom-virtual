const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');
const date   = helper.date(new Date, 'yyyy-mm-dd').toString();

async function getOrder(res, parId)  {

    let business  = await model.getBusiness();
    business = business[0][0];

    const order = await model.getOrder(parId);

    if(!!order.id) 
    {
        order.label = helper.str_pad(order.id, 4, "0", "left", "P");
        order.date  = helper.date(order.created_at, "dd/mm/yyyy");
        order.time  = helper.date(order.created_at, "HH:MM");
        order.tax   = business.order_tax;
    }

    res.json(order);
}

async function getOrders(res, req, type)  {    

    let orders    = await model.getOrders();
    let products  = await model.getProducts();
    let employees = await model.getEmployees();
    let business  = await model.getBusiness();
    business = business[0][0];

    // console.log(business.order_tax);

    orders = helper.orderTotal(orders, products, employees);
    
    let attr = {
        user: business.name,
        logo: "",
        page: "Pedido",
        table: "order",
        belongsto: "",
        order_tax: business.order_tax,
        title: `Pedido | ${business.name}`,
        business: {
            name: config.app.name,
            since: config.app.since, 
            link: config.app.link
        }
    };

    if(!!type && type == 'admin') res.render('./pages/admin/order', { rows:orders, helper, attr, business });
    else res.json(orders);
}

async function insertOrder(res, data) { 

    let business = await model.getBusiness();
    business = business[0][0];

    // Descodifica dados do pedido recebido
    data = JSON.parse(decodeURIComponent(data.data));

    // Ajusta CEP
    data.delivery.zip = data.delivery.zip.replace(/[^0-9]/g,'');
    
    // Verifica se temos cadstro do cliente
    let client_id;
    const client = await model.getClientBy({ mobile: data.client.number });


    if(!client) {
        client_id = await model.insertClient({
            name:          data.client.name,
            mobile:        helper.number_only(data.client.number),
            whatsapp_user: `55${helper.number_only(data.client.number)}@c.us`
        });
    }
    else {
        client_id = client.id;
    }

    // Verifica se existe endereço para atualizar ou adiciona um novo 
    const address = await model.getAddresstBy({ client_id, zip: data.delivery.zip });


    if(!!address) {
        await model.updateAddress(address.id, {
            street:       data.delivery.street,
            number:       data.delivery.number,
            complement:   data.delivery.complement,
            reference:    data.delivery.reference,
            neighborhood: data.delivery.neighborhood,
            city:         data.delivery.city,
            state:        data.delivery.state,
        });
    }
    else if(!!data.delivery.zip && !!data.delivery.street) {
        await model.insertAddress({
            client_id,
            zip:          helper.number_only(data.delivery.zip),
            street:       data.delivery.street,
            number:       data.delivery.number,
            complement:   data.delivery.complement,
            reference:    data.delivery.reference,
            neighborhood: data.delivery.neighborhood,
            city:         data.delivery.city,
            state:        data.delivery.state,
        });
    }

    // Insere o novo pedido 
    const order_id = await model.insertOrder({
        client_id,
        items:        JSON.stringify(data.item),
        delivery:     !!data.order.delivery ? data.order.delivery : 0, 
        type:         data.order.method, 
        origin:       "whatsapp",
        payment_type: data.order.payment,
        payment_obs:  data.order.obs
    });

    if(!!order_id) reportUpdateData(order_id);
    
    res.json({ 
        success:     (!!order_id ? true : false), 
        order_id, 
        order_label: `${helper.str_pad((order_id || ""), 4, "0", "left", "P")}`, 
        order_wait:   business.wait, 
        user_hash:    helper.user_hash_encrypt(client_id)
    });
}

async function updateVisited(res, req) {
    let report = await model.getReport();

    const product_id = req.params.id;

    if(!!product_id)
    {
        report.product = reportProduct(report.product);
    
        if(!report.product[date].visited[product_id]) 
        {
            report.product[date].visited[product_id] = { qty: 0 } 
        }
    
        // Incrementa qtd visitada
        report.product[date].visited[product_id].qty++;
    
        // Salva dados
        await model.updateReport({
            product: JSON.stringify(report.product)
        });
    }


    res.json({status:'processed'});
}



const reportUpdateData = async (order_id) => {
    
    let order  = await model.getOrder(order_id);
    let report = await model.getReport();

    // try {
    //     report = JSON.parse(report)
    // } catch (error) {
    //     report = { product: {}, payment: {}, order: {}, product: {}}
    // }

    report.order    = reportOrder(report.order);
    report.payment  = reportPayment(report.payment);
    report.delivery = reportDelivery(report.delivery);
    report.product  = reportProduct(report.product);

    try {
        items = JSON.parse(order.items)
    } catch (error) {
        items = null;
    }

    if(!!items && !!items.length)
    {
        let qty   = await items.map(el => parseInt(el.qty)).reduce((a, c) => a + c);
        price = await items.map(el => parseFloat(el.qty) * parseFloat(el.price)).reduce((a, c) => parseFloat(a) + parseFloat(c));
        price = parseFloat(price.toFixed(2));

        if(!!order.type) 
        {
            report.order[date][order.type].qty  += qty;
            report.order[date][order.type].cost += price;
        }

        if(!!order.payment_type) {
            report.payment[date].type[order.payment_type].cost += price;
        }

        if(!!order.origin) {
            report.payment[date].origin[order.origin].cost += price;

            items.forEach(el => {
                if(!report.product[date].sold[order.origin][el.id]) 
                {
                    report.product[date].sold[order.origin][el.id] = { qty: 0, cost: 0 } 
                }

                eqty = parseInt(el.qty);
                eprice = parseFloat(el.qty) * parseFloat(el.price);
                eprice = parseFloat(eprice.toFixed(2));

                report.product[date].sold[order.origin][el.id].qty  += eqty;
                report.product[date].sold[order.origin][el.id].cost += eprice;
            });
        }

        if(!!order.employee_id) 
        {
            if(!report.delivery[date][order.employee_id]){
                report.delivery[date][order.employee_id] = { qty: 0, cost: 0 };
            }

            report.delivery[date][order.employee_id].qty  += qty;
            report.delivery[date][order.employee_id].cost += price;
        }
        else
        {
            report.delivery[date].others.qty  += qty;
            report.delivery[date].others.cost += price;
        }

        report.order[date].cliente.qty++;
        report.order[date].item.qty += items.length;


        // Salva dados
        await model.updateReport({
            product: JSON.stringify(report.product),
            payment: JSON.stringify(report.payment),
            order: JSON.stringify(report.order),
            delivery: JSON.stringify(report.delivery),
        });
    }

    // console.log(report.order[date]);
    // console.log(report.payment[date]);
    // console.log(report.delivery[date]);
    // console.log(report.product[date].sold);
}

const reportOrder = (order) => {

    try {
        if(!!order) order = JSON.parse(order);
        else order = {};
    } catch (error) {
        order = {};
    }
    
    
    if(!!order && !order[date]) {
        order[date] = {
            consumir : { qty: 0, cost: 0.0 },
            retirar  : { qty: 0, cost: 0.0 },
            entregar : { qty: 0, cost: 0.0 },
            cliente  : { qty: 0 },
            item     : { qty: 0 }
        }
    }

    return order;
}

const reportPayment = (payment) => {
    
    try {
        if(!!payment) payment = JSON.parse(payment);
        else payment = {};
    } catch (error) {
        payment = {};
    }
    
    if(!!payment && !payment[date]) {
        payment[date] = { 
            type:{
                credito  : { cost: 0 },
                debito   : { cost: 0 },
                voucher  : { cost: 0 },
                dinheiro : { cost: 0 },
            },
            origin:{
                whatsapp : { cost: 0 },
                mesa     : { cost: 0 },
                website  : { cost: 0 }, 
                telefone : { cost: 0 } 
            }    
        }
    }

    return payment;
}

const reportDelivery = (delivery) => {
    
    try {
        if(!!delivery) delivery = JSON.parse(delivery);
        else delivery = {};
    } catch (error) {
        delivery = {};
    }
    
    if(!!delivery && !delivery[date]) {
        delivery[date] = {
            // "employee_id" : { qty: 0, cost: 0 },
            others : { qty: 0, cost: 0 }
        }
    }

    return delivery;
}

const reportProduct = (product) => {
    
    try {
        if(!!product) product = JSON.parse(product);
        else product = {};
    } catch (error) {
        product = {};
    }
    
    if(!!product && !product[date]) {
        product[date] = {
            visited: {
                // "product_id" : { qty: 0 } 
            },
            sold: {
                whatsapp : {}, // { "product_id" : { qty: 0, cost: 0 } }
                mesa     : {},
                website  : {}, 
                telefone : {} 
            }, 
            star: {} // { "product_id" : { rate: 0 } }
        }
    }

    return product;
}


module.exports = { getOrder, getOrders, insertOrder, updateVisited }