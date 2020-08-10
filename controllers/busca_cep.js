const cep = require('cep-promise');
const { google_maps } = require('../config/.env');
const model  = require('../models');
const distance = require('google-distance');
distance.apiKey = google_maps.apikey;

async function getCepEndereco(res, req)  {

    let business = await model.getBusiness();
    business = business[0][0];

    // Busca endereço
    let endereco = {};
    try {
        endereco = await cep(req.params.cep)
            .then(async function(cep) {
            return await cep;
        });
    } catch (error) {
        endereco.distance = -1;
        endereco.delivery = 0;
        endereco.limite   = -1;
        endereco.limited  = business.delivery_limite;
        endereco.msg      = "CEP não encontrado!";
        console.log(endereco.msg)
    }

    if(!!endereco)
    {
        // Calcula distancia
        try {
            distance.get(
            {
                origin: `${business.zip}, ${business.city}-${business.state}`,
                destination: `${endereco.cep}, ${endereco.city}-${endereco.state}`,
                mode: 'driving',
                units: 'metric',
                language: 'pt-BR'
            },
            async function(err, data) 
            {    
                if (err) { 
                    endereco.distance = -1;
                    endereco.delivery = 0;
                    endereco.limite   = -1;
                    endereco.limited  = business.delivery_limite;
                    endereco.msg      = "Não foi possível calcular a distância para o CEP informado!";
                }
                else 
                {
                    endereco.distance = Math.ceil(data.distanceValue / 1000);
                    endereco.delivery = !business.delivery_type ? business.delivery_cost : (endereco.distance * business.delivery_cost);
                    endereco.limite   = endereco.distance > business.delivery_limite ? 0 : 1;
                    endereco.limited  = business.delivery_limite;
                    endereco.msg      = "";
                }

                await res.json(endereco);
            });
        } catch (error) {
            endereco.distance = -1;
            endereco.delivery = 0;
            endereco.limite   = -1;
            endereco.limited  = business.delivery_limite;
            endereco.msg      = "Falha ao calcular a distância para o CEP informado!";

            res.json(endereco);
        }
    }   
    else
    {
        res.json(endereco);
    } 
}

module.exports = { getCepEndereco }