const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');

async function getProducts(res, req, type)  {    

    let products   = await model.getProducts();
    let categories = await model.getCategories();
    let business   = await model.getBusiness();
    business = business[0][0];

    products = helper.relationshipBelongsto(products, categories, 'category');
    
    let attr = {
        user: business.name,
        logo: "",
        page: "Produto",
        table: "product",
        belongsto: "category",
        title: `Produto | ${business.name}`,
        business : {
            name: config.app.name,
            since: config.app.since
        }
    };

    if(!!type && type == 'admin') res.render('./pages/admin/product', { rows:products, helper, attr, business });
    else res.json(products);
}

async function getProduct(res, parId) { 

    const product = await model.getProduct(parId);

    if(!!product)
    {
        const category = await model.getCategory(product.category_id);
        product.category = category.name;
    }

    res.json({ ...product });
}

async function updateProduct(res, parId, data) { 

    await model.updateProduct(parId, data);
    const product = await model.getProduct(parId);

    res.json(product);
}

async function insertProduct(res, data) { 

    const insertId = await model.insertProduct(data);
    const product  = await model.getProduct(insertId);

    res.json(product);
}

async function deleteProduct(res, parId) { 

    const qtyDeleted = await model.deleteProduct(parId);
    
    const success = qtyDeleted > 0 ? true : false
    const message = qtyDeleted > 0 ? 'Excluído com sucesso!' : `Produto com ID: ${parId} não foi deletado`;

    res.json({success, message});
}

module.exports = { getProducts, getProduct, updateProduct, insertProduct, deleteProduct }