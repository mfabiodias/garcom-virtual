const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');

async function getAddress(res, parId) { 

    const address = await model.getAddress(parId);
    
    res.json(address);
}

async function updateAddress(res, parId, data) { 

    if(!!data.zip) {    
        data.zip = helper.number_only(data.zip);
    }

    const updatId = await model.updateAddress(parId, data);
    
    const success = !!updatId ? true : false
    const message = !!updatId ? 'Endereço atualizado com sucesso!' : `Falha ao atualizar endereço! Tente novamente e persistindo o erro contate o adminstrador`;

    res.json({success, message});
}

async function insertAddress(res, data) { 

    if(!!data.zip) {    
        data.zip = helper.number_only(data.zip);
    }
    
    const insertId = await model.insertAddress(data);

    const success = !!insertId ? true : false
    const message = !!insertId ? 'Endereço inserido com sucesso!' : `Falha ao inserir endereço! Tente novamente e persistindo o erro contate o adminstrador`;

    res.json({success, message});
}

async function deleteAddress(res, parId) { 

    const qtyDeleted = await model.deleteAddress(parId);
    
    const success = qtyDeleted > 0 ? true : false
    const message = qtyDeleted > 0 ? 'Excluído com sucesso!' : `Enderço com ID: ${parId} não foi deletado`;

    res.json({success, message});
}

module.exports = { getAddress, updateAddress, insertAddress, deleteAddress }