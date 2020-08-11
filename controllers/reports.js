const helper = require('../helpers');
const model  = require('../models');
const config = require('../config/config');

async function getReport(res, req, type)  {   

    let business = await model.getBusiness();
    business = business[0][0];
    
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
    
    res.render('./pages/admin/report', { attr, business });
}

module.exports = { 
    getReport
} 