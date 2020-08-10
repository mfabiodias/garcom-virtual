const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');

async function getMailings(res, req, type) { 

    const mailings = await model.getMailings();
    const clients  = await model.getClients();

    let business = await model.getBusiness();
    business = business[0][0];

    const attr = {
        user: business.name,
        logo: "",
        page: "Lista Envio",
        table: "mailing",
        belongsto: "",
        title: `Lista Envio | ${business.name}`,
        business : {
            name: config.app.name,
            since: config.app.since
        }
    };
    
    if(!!type && type == 'admin') res.render('./pages/admin/mailing', { rows:mailings, helper, attr, clients, business });
    else res.json(mailings);
}

async function getMailing(res, parId) { 

    const mailing = await model.getMailing(parId);
    
    res.json(mailing);
}

async function updateMailing(res, parId, data) { 

    await model.updateMailing(parId, data);
    const mailing = await model.getMailing(parId);

    res.json(mailing);
}

async function insertMailing(res, data) { 

    const insertId = await model.insertMailing(data);
    const mailing = await model.getMailing(insertId);

    res.json(mailing);
}

async function deleteMailing(res, parId) { 

    const { campaign_qty } = await model.hasManyCampaign({mailing_id:parId});

    let success;
    let message;
    if(campaign_qty > 0)
    {
        success = false
        message = `Lista Envio com SKU: ${helper.str_pad(parId, 3, "0", "left", "L")} tem ${campaign_qty} campanha(s) vinculada(s) e não pode ser excluída`;
    }
    else
    {
        const qtyDeleted = await model.deleteMailing(parId);

        success = qtyDeleted > 0 ? true : false
        message = qtyDeleted > 0 ? 'Excluído com sucesso!' : `Lista Envio com ID: ${parId} não foi deletado`;
    }
    
    res.json({success, message});
}

module.exports = { getMailings, getMailing, updateMailing, insertMailing, deleteMailing }