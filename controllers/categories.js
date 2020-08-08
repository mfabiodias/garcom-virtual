const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');

async function getCategories(res, req, type) { 

    // console.log("userId:",req.userId);

    let business = await model.getBusiness();
    business = business[0][0];

    const categories = await model.getCategories();
    
    const attr = {
        user: business.name,
        logo: "",
        page: "Categoria",
        table: "category",
        belongsto: "",
        title:  `Categoria | ${business.name}`,
        business : {
            name: config.app.name,
            since: config.app.since
        }
    };
    
    if(!!type && type == 'admin') res.render('./pages/admin/category', { rows:categories, helper, attr });
    else res.json(categories);
}

async function getCategory(res, parId) { 

    const category = await model.getCategory(parId);
    
    res.json(category);
}

async function updateCategory(res, parId, data) { 

    await model.updateCategory(parId, data);
    const category = await model.getCategory(parId);

    res.json(category);
}

async function insertCategory(res, data) { 

    const insertId = await model.insertCategory(data);
    const category = await model.getCategory(insertId);

    res.json(category);
}

async function deleteCategory(res, parId) { 

    const { product_qty } = await model.hasManyProduct({category_id:parId});

    let success;
    let message;
    if(product_qty > 0)
    {
        success = false
        message = `Categoria com SKU: ${helper.str_pad(parId, 3, "0", "left", "C")} tem ${product_qty} produto(s) vinculado(s) e não pode ser excluída`;
    }
    else
    {
        const qtyDeleted = await model.deleteCategory(parId);

        success = qtyDeleted > 0 ? true : false
        message = qtyDeleted > 0 ? 'Excluído com sucesso!' : `Categoria com ID: ${parId} não foi deletado`;
    }
    
    res.json({success, message});
}

module.exports = { getCategories, getCategory, updateCategory, insertCategory, deleteCategory }