const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');

async function getBusiness(res, req, type) { 

    // console.log("userId:",req.userId);

    let business = await model.getBusiness();
    business = business[0][0];
    
    const attr = {
        user: business.name,
        logo: "",
        page: "Configuração da Loja",
        table: "business",
        belongsto: "",
        title:  `Configuração da Loja | ${business.name}`,
        business : {
            name: config.app.name,
            since: config.app.since, 
            link: config.app.link
        }
    };
    
    if(!!type && type == 'admin') res.render('./pages/admin/business', { row:business, helper, attr, business });
    else res.json(business);
}

async function updateBusiness(res, parId, data) { 

    const business_data = { 
        name:            data.name, 
        mobile:          helper.number_only(data.mobile),
        user:            data.user, 
        pass:            data.pass, 
        payment_money:   data.payment_money, 
        payment_credit:  data.payment_credit, 
        payment_debit:   data.payment_debit, 
        payment_voucher: data.payment_voucher,
        order_retire:    data.order_retire, 
        order_deliver:   data.order_deliver, 
        order_consume:   data.order_consume, 
        order_tax:       data.order_tax, 
        delivery_type:   data.delivery_type, 
        delivery_cost:   data.delivery_cost, 
        delivery_limite: data.delivery_limite, 
        tables:          data.tables,
        wait:            data.wait, 
        open:            data.open, 
        printer_size:     data.printer_size 
    };

    const address_data  = { 
        zip:          helper.number_only(data.zip),
        street:       data.street,
        number:       data.number,
        complement:   data.complement,
        reference:    data.reference,
        neighborhood: data.neighborhood,
        city:         data.city,
        state:        data.state
    };

    delete business_data.confirm_pass;
    if(!business_data.pass.length) { delete business_data.pass; }
    if(!business_data.open.length) { delete business_data.open; } 
    else {
        try {
            if(typeof JSON.parse(business_data.open) != 'object') { delete business_data.open; }
        } catch (e) {
            delete business_data.open;
        }
    }

    await model.updateBusiness(business_data);
    
    const address = await model.getAddresstBy({business_id: 1});

    if(!!address) {

        if(!!address_data.zip) {    
            address_data.zip = helper.number_only(address_data.zip);
        }
        
        await model.updateAddressBy({business_id: 1}, address_data);
    }
    else {

        if(!!address_data.zip) {    
            address_data.zip = helper.number_only(address_data.zip);
        }

        address_data.business_id = 1;
        await model.insertAddress(address_data);
    }

    let business = await model.getBusiness();
    business = business[0][0];

    res.json(business);
}

module.exports = { getBusiness, updateBusiness }