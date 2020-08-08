const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');

async function getMessage(res, parId) { 

    const message = await model.getMessage(parId);
    
    res.json(message);
}

async function updateMessage(res, parId, data) { 

    try { data.contains = JSON.parse(data.contains) } 
    catch(e) { data.contains = [] }
    data.contains = JSON.stringify(data.contains);

    try { data.exact = JSON.parse(data.exact) } 
    catch(e) { data.exact = [] }
    data.exact = JSON.stringify(data.exact);

    await model.updateMessage(parId, data);
    const message = await model.getMessage(parId);

    res.json(message);
}

async function insertMessage(res, data) { 

    if(!data.exact) delete data.exact;
    if(!data.contains) delete data.contains;
    
    const insertId = await model.insertMessage(data);
    const message = await model.getMessage(insertId);

    res.json(message);
}

async function deleteMessage(res, parId) { 

    const qtyDeleted = await model.deleteMessage(parId);
    
    const success = qtyDeleted > 0 ? true : false
    const message = qtyDeleted > 0 ? 'Excluído com sucesso!' : `Mensagem com ID: ${parId} não foi deletado`;

    res.json({success, message});
}

module.exports = { getMessage, updateMessage, insertMessage, deleteMessage }