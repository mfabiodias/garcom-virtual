const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');

async function getUserOrders(res, req)  {

    let business = await model.getBusiness();
    business = business[0][0];

    let categories = await model.getCategories();

    // Adiciona uri nas categorias
    categories.map(el => {
        el.uri = helper.tag_name(el.name);
        return el;
    });

    const client_id = helper.user_hash_decrypt(req.params.user);

    let orders = await model.getOrdersBy({ client_id });
    orders = !!orders ? orders : [];
    
    let attr = {
        user: business.name,
        page: "Meus Pedidos",
        title: business.name,
        business : {
            name: config.app.name,
            since: config.app.since, 
            link: config.app.link
        }
    }; 

    res.render('./pages/home/orders', { attr, helper, categories, orders, business });
}

module.exports = { 
    getUserOrders 
}