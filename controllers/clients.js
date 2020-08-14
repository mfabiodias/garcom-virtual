const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');
const { Client } = require('knex');

async function getClients(res, req, type) { 

    // console.log("userId:",req.userId);

    let business = await model.getBusiness();
    business = business[0][0];

    const clients  = await model.getClients();
    const adresses = await model.getAdresses();
    
    const attr = {
        user: business.name,
        logo: "",
        page: "Cliente",
        table: "client",
        belongsto: "",
        title:  `Cliente | ${business.name}`,
        business : {
            name: config.app.name,
            since: config.app.since, 
            link: config.app.link
        }
    };

    // Víncular endereços aos seus clientes
    clients.map((client) => {

        client.adresses = adresses.filter(address => {
            if(address.client_id == client.id)
            {
                address.label = `${helper.mask(address.zip,'##.###-###')} - ${address.street} ${address.number}, ${address.neighborhood}, ${address.city}/${address.state}`;
                return true;
            }

            return false;
        });

        console.log(client.adresses);
        return client;
    });

    // console.log(clients);
    
    if(!!type && type == 'admin') res.render('./pages/admin/client', { rows:clients, helper, attr, business });
    else res.json(clients);
}

async function getClient(res, parId) { 

    const client = await model.getClient(parId);
    
    res.json(client);
}

async function getClientAddress(res, req) { 

    const client = await model.getAddressAll({ client_id: req.params.id });
    
    res.json(client);
}

async function updateClient(res, parId, data) { 

    if(!!data.mobile) 
    {    
        // Limpa número WhatsApp
        data.mobile = helper.number_only(data.mobile);
        
        // Cria o ID WhatsApp
        data.whatsapp_user = `55${data.mobile}@c.us`
    }
    
    await model.updateClient(parId, data);
    const client = await model.getClient(parId);

    res.json(client);
}

async function insertClient(res, data) { 

    if(!!data.mobile) 
    {    
        // Limpa número WhatsApp
        data.mobile = helper.number_only(data.mobile);
        
        // Cria o ID WhatsApp
        data.whatsapp_user = `55${data.mobile}@c.us`
    }

    const insertId = await model.insertClient(data);
    const client   = await model.getClient(insertId);

    res.json(client);
}

async function deleteClient(res, parId) { 

    const { order_qty } = await model.hasManyOrder({client_id:parId});

    let success;
    let message;
    if(order_qty > 0)
    {
        success = false
        message = `Cliente com SKU: ${helper.str_pad(parId, 3, "0", "left", "F")} tem ${order_qty} pedido(s) vinculado(s) e não pode ser excluído`;
    }
    else
    {
        await model.deleteAddressBy({client_id:parId});
        const qtyDeleted = await model.deleteClient(parId);

        success = qtyDeleted > 0 ? true : false
        message = qtyDeleted > 0 ? 'Excluído com sucesso!' : `Cliente com ID: ${parId} não foi deletado`;
    }
    
    res.json({success, message});
}

module.exports = { getClients, getClient, getClientAddress, updateClient, insertClient, deleteClient }