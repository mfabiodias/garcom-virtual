const fs     = require('fs');
const path   = require('path'); 
const helper = require('../helpers');
const model  = require('../models');
const config = require('../config/config');

async function getHome(res, req, type)  {   

    let business = await model.getBusiness();
    business = business[0][0];

    const client = !!process.env.CLIENT ? "/"+process.env.CLIENT : "";
    const folder = `${process.cwd()}/public/image/business${client}`;
    
    if (!fs.existsSync(`${folder}/${business.image}`)) {
        rootFile = require('path').resolve(process.cwd())+"/public/image/no-logo.jpg";
    } else {
        rootFile = `${folder}/${business.image}`;
    }
    
    try {
        if(mime = helper.mime_type(path.extname(rootFile))) {
            logo = mime ? 'data:'+mime+';base64, '+fs.readFileSync(rootFile, { encoding: 'base64' }) : '';
        }
    } catch(err) {
        logo = "";
        console.log('Erro: Logo Root não encontrado em '+rootFile)
    }

    let attr = {
        user: business.name,
        logo,
        page: "",
        table: "",
        belongsto: "",
        title: business.name,
        business : {
            name: config.app.name,
            since: config.app.since
        }
    }; 

    res.render('./pages/admin/home', { attr, business });
}

module.exports = { 
    getHome
}