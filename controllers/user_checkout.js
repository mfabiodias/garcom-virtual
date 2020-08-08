const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');

async function getProductList(res, req)  {   

    let business = await model.getBusiness();
    business = business[0][0];

    let products   = await model.getProducts();
    let categories = await model.getCategories();

    let item  = { product: [] };
    let items = helper.relationshipHasMany(products, categories, 'product');

    // Adiciona uri nas categorias
    categories.map(el => {
        el.uri = helper.tag_name(el.name);
        return el;
    });

    // Adiciona uri nas categorias de todos os itens
    items.map(el => {
        el.uri = helper.tag_name(el.name);
        return el;
    });

    if(!!req.params.category) 
    {
        if(req.params.category == 'destaque')
        {
            item.name = "Destaques de Hoje"
            items.find(el => {
                el.product.forEach(e => {
                    if(!!e.featured) item.product.push(e);
                });
                return false;
            });
        }
        else 
        {
            items.find(el => {
                if(el.uri == req.params.category) {
                    item = el;
                    return true;
                }
                return false;
            });
        }
    }
    else if(!!items.length) {
        item = items[0];
    }

    // console.log(item);
    
    let attr = {
        user: business.name,
        page: "Realizar Pedido",
        title: business.name,
        aux: 0,
        qtd: 0,
        open: helper.business_open(business.open, business.weekday),
        week: helper.bdWeekLabel(business.weekday),
        business : {
            name: config.app.name,
            since: config.app.since
        }
    }; 
    
    if(!!item.name) {
        res.render('./pages/home/items', { attr, helper, business, categories, item });
    }
    else {
        res.redirect('/');
    }
}

async function getUserCheckout(res, req)  {   

    let business = await model.getBusiness();
    business = business[0][0];

    let categories = await model.getCategories();

    // Adiciona uri nas categorias
    categories.map(el => {
        el.uri = helper.tag_name(el.name);
        return el;
    });

    let attr = {
        user: business.name,
        page: "Finalizar Pedido",
        title: business.name,
        aux: 0,
        qtd: 0,
        business : {
            name: config.app.name,
            since: config.app.since
        }
    }; 
    
    res.render('./pages/home/checkout', { attr, helper, business, categories });
}


module.exports = { getProductList, getUserCheckout }