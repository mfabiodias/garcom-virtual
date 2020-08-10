const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');
const { date } = require('../helpers');

async function getCampaigns(res, req, type)  {    

    // console.log("userId:",req.userId);

    let business = await model.getBusiness();
    business = business[0][0];

    let campaigns = await model.getCampaigns();
    let mailings  = await model.getMailings();

    campaigns = helper.relationshipBelongsto(campaigns, mailings, 'mailing');
    
    let attr = {
        user: business.name,
        logo: "",
        page: "Campanha",
        table: "campaign",
        belongsto: "mailing",
        title:  `Campanha | ${business.name}`,
        business : {
            name: config.app.name,
            since: config.app.since
        }
    };

    if(!!type && type == 'admin') res.render('./pages/admin/campaign', { rows:campaigns, helper, attr, business });
    else res.json(campaigns);
}

async function getCampaign(res, parId) { 

    const campaign = await model.getCampaign(parId);

    if(!!campaign)
    {
        const mailing = await model.getCategory(campaign.mailing_id);
        campaign.mailing = mailing.name;
    }

    res.json({ ...campaign });
}

async function updateCampaign(res, parId, data) { 

    data = await validador(data);
    if(!!data.error) {
        res.json({error: data.error});
    }
    else {
        await model.updateCampaign(parId, data);
        const campaign = await model.getCampaign(parId);
    
        res.json(campaign);
    }
}

async function insertCampaign(res, data) { 

    data = await validador(data);
    if(!!data.error) {
        res.json({error: data.error});
    }
    else {
        const insertId = await model.insertCampaign(data);
        const campaign  = await model.getCampaign(insertId);
    
        res.json(campaign);
    }
}

async function deleteCampaign(res, parId) { 

    const qtyDeleted = await model.deleteCampaign(parId);
    
    const success = qtyDeleted > 0 ? true : false
    const message = qtyDeleted > 0 ? 'Excluído com sucesso!' : `Campanha com ID: ${parId} não foi deletado`;

    res.json({success, message});
}

async function validador(data) {
    // Recorrente somente para dias da semana
    if(data.recurrent == 1 && helper.weekDayCheck(data.schedule_day)) { 
        delete data.schedule_date;
        return data;
    }
    // Não recorrente somente para dias específicos
    else if(data.recurrent == 0 && helper.bdDateCheck(data.schedule_date)) {
        delete data.schedule_day;
        data.schedule_date = helper.bdDateCheck(data.schedule_date);
        return data;
    }
    else return { error: "Formato de Data inválido! Tente novamente e persisitindo o erro contate o adminstrador!" };
}

module.exports = { getCampaigns, getCampaign, updateCampaign, insertCampaign, deleteCampaign }