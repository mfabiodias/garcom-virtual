const fs       = require('fs');
const path     = require('path'); 
const helper   = require('../helpers');
const config   = require('../config/config');
const model    = require('../models');
const { exec } = require('child_process');
const rimraf   = require("rimraf");


// start = async () => {
//     let whatsapp = await model.getWhatsapp('gestor');

//     blockeds = JSON.parse(whatsapp.blocked);
//     blockeds = !!blockeds && !!blockeds.length ? blockeds : [];

//     console.log(blockeds)
// }
// start();

async function getWhatsapp(res, req, type) { 

    // icon https://whatsapp-emoticons.pt.downloadastro.com/tools/

    let business = await model.getBusiness();
    business = business[0][0];

    const whatsapp = await model.getWhatsapp('gestor');
    const messages = await model.getMessages();

    let blockeds = JSON.parse(whatsapp.blocked);
    blockeds = !!blockeds && !!blockeds.length ? blockeds : [];

    let nomatchs = JSON.parse(whatsapp.no_match);
    nomatchs = !!nomatchs && !!nomatchs.length ? nomatchs : [];

    const attr = {
        user: business.name,
        logo: "",
        page: "WhatsApp Ajuste",
        table: "message",
        belongsto: "",
        blockeds, 
        nomatchs, 
        title: `WhatsApp Ajuste | ${business.name}`,
        business : {
            name: config.app.name,
            since: config.app.since, 
            link: config.app.link
        }
    };
    
    if(!!type && type == 'admin') res.render('./pages/admin/whatsapp', { whatsapp, messages, helper, attr, business });
    else res.json(whatsapp);
}

async function getWhatsappChatBot(res, req, type) { 

    let business = await model.getBusiness();
    business = business[0][0];

    const attr = {
        user: business.name,
        logo: "",
        page: "WhatsApp ChatBot",
        table: "whasapp",
        belongsto: "",
        title: `WhatsApp ChatBot | ${business.name}`,
        business : {
            name: config.app.name,
            since: config.app.since, 
            link: config.app.link
        }
    };
    
    if(!!type && type == 'admin') res.render('./pages/admin/whatsapp_chatbot', { attr, business });
    else res.json(whatsapp);
}

async function getWhatsappMessages() { 

    const { group_reply, blocked, no_match } = await model.getWhatsapp('gestor');
    const messages = await model.getMessages();

    const botJson = {
        appconfig: { headless: true, isGroupReply: (!!group_reply ? true : false) },
        bot: helper.messageResponse(messages),
        blocked: helper.messageBlocked(blocked),
        noMatch: helper.messageNoMatch(no_match),
        smartreply: {
            suggestions: [],
            clicktosend: false
        }
    }

    // console.log(botJson);

    // Monta arquivo de mensagens do wpp para o cliente
    const client = !!process.env.CLIENT ? "/"+process.env.CLIENT : "";
    fs.writeFile(`${process.cwd()}/whatsapp/bot${client}/bot.json`, JSON.stringify(botJson, null, "\t"), function(err) {
        if (err) {
            console.log('Falha ao criar bot.json');
        }
        else {
            console.log('bot.json criado com sucesso!');
        }
    });

    return botJson;
}

async function getWhatsappCampaignMessages(res, req) { 

    const mailing = await model.getCampaignMailing();
    const clients = await model.getClients();
    const cfolder = !!process.env.CLIENT ? "/"+process.env.CLIENT : "";

    const lista = await mailing[0].map((el) => {
        // el.image = !!el.image ? `/public/image/campaign${cfolder}/${el.image}`: ""; 
        
        el.image_data = !!el.image ? base64_encode(`./public/image/campaign${cfolder}/${el.image}`) : ""; 

        el.image = !el.image ? "" : el.image;
        
        if(el.type == 'all') {
            el.clients = clients.filter((cli) => !!cli.whatsapp_user);
        }
        else {
            el.clients = clients.filter((cli) => !!cli.whatsapp_user && el.client_list.includes(cli.id));
        }
        return el;
    });

    const messages = await helper.messageCampaign(lista);

    res.json(messages);
}

async function getWhatsappRestart(res, req) {

    if(!!process.env.WPPNAME)
    {
        const my_shell_command = `pm2 restart ${process.env.WPPNAME}`;
        
        exec(my_shell_command, (err, stdout, stderr) => {
            if (err) {
                //some err occurred
                console.error(err)
            } else {

                // Força um reinicio e exclui cache para rescanear QR CODE
                if(req.body.restart == 'true') {
                    rimraf.sync('./chromium-data'+(!!process.env.CLIENT ? "/"+process.env.CLIENT : ""));
                }

                // the *entire* stdout and stderr (buffered)
                // console.log(`stdout: ${stdout}`);
                // console.log(`stderr: ${stderr}`);
            }
        });

        res.json({ result: "success" });
    }
    else
    {
        res.json({ result: "error" });
    }
}

async function getWhatsappME(res, req) {

    let business = await model.getBusiness();
    business = business[0][0];

    const url = business.mobile.length >= 10 ? `https://wa.me/55${business.mobile}` : '/';

    res.redirect(url);
}

async function setWhatsappCampaignStatus(res, req) { 

    // console.log(req.params.id, req.params.status);

    if(!!req.params.status && req.params.status == 'sent') {
        data = { status:req.params.status, sent_date: helper.date(new Date, 'yyyy-mm-dd HH:MM:00')};
    }
    else
    {
        data = { status:req.params.status };
    }

    const response = await model.updateCampaign(req.params.id, data );

    res.json({ response });
}

async function updateWhatsapp(res, parId, data) { 
    
    let rtn;
    
    if(!!data.blocked_add) {
        const whatsapp = await model.getWhatsapp(parId);
        
        let blockeds = JSON.parse(whatsapp.blocked);
        blockeds = !!blockeds && !!blockeds.length ? blockeds : [];

        let blocked = data.blocked_add;
        blocked = !!blocked && !!blocked.length ? blocked : false;
        blocked = !!blocked ? helper.number_only(blocked) : "";

        let idx = blockeds.findIndex(el => blocked == el);

        if(idx >= 0) {
            rtn = { crud_msg : `Erro: Número ${blocked} já encontra-se bloqueado!` }
        }
        else if(blocked.length >= 10) {
            blockeds.push(blocked);
            data = { blocked: JSON.stringify(blockeds) };

            await model.updateWhatsapp(parId, data);
            rtn = await model.getWhatsapp(parId);
        }
        else {
            rtn = { crud_msg : `Erro: Número ${blocked} inválido! Informe o número com DDD.` }
        }
    }
    else if(!!data.blocked_delete) {
        const whatsapp = await model.getWhatsapp(parId);
        
        let blockeds = JSON.parse(whatsapp.blocked);
        blockeds = !!blockeds && !!blockeds.length ? blockeds : [];

        let blocked = data.blocked_delete;
        blocked = !!blocked && !!blocked.length ? blocked : false;
        blocked = !!blocked ? helper.number_only(blocked) : "";

        let idx = blockeds.findIndex(el => blocked == el);

        if(idx >= 0) {
            blockeds.splice(idx, 1);
            data = { blocked: JSON.stringify(blockeds) };

            await model.updateWhatsapp(parId, data);
            rtn = await model.getWhatsapp(parId);
        }
        else {
            rtn = { crud_msg : `Erro: Falha ao excluir o número ${blocked}! Tente novamente e persistindo o erro contate o administrador.` }
        }
    }
    else if(!!data.nomatch_add) {
        const whatsapp = await model.getWhatsapp(parId);
        
        let nomatchs = JSON.parse(whatsapp.no_match);
        nomatchs = !!nomatchs && !!nomatchs.length ? nomatchs : [];

        let nomatch = data.nomatch_add;
        nomatch = !!nomatch && !!nomatch.length ? decodeURIComponent(nomatch).trim() : false;
        nomatch = !!nomatch ? nomatch : "";

        nomatchs.push(nomatch);
        data = { no_match: JSON.stringify(nomatchs) };

        await model.updateWhatsapp(parId, data);
        rtn = await model.getWhatsapp(parId);
    }
    else if(!!data.nomatch_delete) {
        const whatsapp = await model.getWhatsapp(parId);
        
        let nomatchs = JSON.parse(whatsapp.no_match);
        nomatchs = !!nomatchs && !!nomatchs.length ? nomatchs : [];

        let idx = parseInt(data.nomatch_delete);
        
        if(!!idx && idx >= 0) {
            nomatchs.splice(idx, 1);
            data = { no_match: JSON.stringify(nomatchs) };

            await model.updateWhatsapp(parId, data);
            rtn = await model.getWhatsapp(parId);
        }
        else {
            rtn = { crud_msg : `Erro: Falha ao excluir mensagem! Tente novamente e persistindo o erro contate o administrador.` }
        }
    }
    else if(!!data.nomatch_edit) {
        const whatsapp = await model.getWhatsapp(parId);
        
        let nomatchs = JSON.parse(whatsapp.no_match);
        nomatchs = !!nomatchs && !!nomatchs.length ? nomatchs : [];

        let idx = parseInt(data.nomatch_edit_idx);
        let nomatch = data.nomatch_edit;
        nomatch = !!nomatch && !!nomatch.length ? decodeURIComponent(nomatch).trim() : false;
        nomatch = !!nomatch ? nomatch : "";
        
        if(!!idx && idx >= 0 && !!nomatch) {
            
            nomatchs[idx] = nomatch;

            data = { no_match: JSON.stringify(nomatchs) };

            await model.updateWhatsapp(parId, data);
            rtn = await model.getWhatsapp(parId);
        }
        else {
            rtn = { crud_msg : `Erro: Falha ao atualizar mensagem! Tente novamente e persistindo o erro contate o administrador.` }
        }
    }
    else
    {
        await model.updateWhatsapp(parId, data);
        rtn = await model.getWhatsapp(parId);
    }
    
    res.json(rtn);
}


function base64_encode(file) 
{
    if (!!fs.existsSync(file)) 
    {
        // const bitmap = fs.readFileSync(file);
        // return new Buffer(bitmap).toString('base64');

        mime = helper.mime_type(path.extname(file))
        return !!mime ? 'data:'+mime+';base64, '+fs.readFileSync(file, { encoding: 'base64' }) : "";

    }

    return "";
}

module.exports = { 
    getWhatsapp, getWhatsappChatBot, getWhatsappMessages, 
    getWhatsappCampaignMessages, getWhatsappRestart, getWhatsappME, 
    setWhatsappCampaignStatus, updateWhatsapp 
}