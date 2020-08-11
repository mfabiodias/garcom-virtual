const helper = require('../helpers');
const config = require('../config/config');
const model  = require('../models');
const QRCode = require('qrcode');

async function getQrCode(res, req, type) { 

    // console.log("userId:",req.userId);

    let business = await model.getBusiness();
    business = business[0][0];
    
    const attr = {
        user: business.name,
        logo: "",
        page: "Configuração da Códigos QR",
        table: "business",
        belongsto: "",
        title:  `Configuração da Códigos QR | ${business.name}`,
        business : {
            name: config.app.name,
            since: config.app.since, 
            link: config.app.link
        }
    };
    
    if(!!type && type == 'admin') res.render('./pages/admin/qrcode', { row:business, helper, attr, business });
    else res.json(business);
}

async function getQrCodeData(res, req) 
{    
    const type   = req.params.type;
    const params = req.body;
    const image  = { success: false, type, string: "", qrcode: "", params }; 
    
    if(!!type) 
    {
        if(type == 'Wi-Fi')
        {
            // WIFI:T:WEP;S:fabio;P:1234565;H:true;    // --- WEP Hidden
            // WIFI:T:WEP;S:fabio;P:1234565;H:;        // --- WEP
            
            // WIFI:T:WPA;S:fabio;P:1234565;H:true;    // --- WPA/WPA2 Hidden
            // WIFI:T:WPA;S:fabio;P:1234565;H:;        // --- WPA/WPA2
            
            // WIFI:T:nopass;S:fabio;P:1234565;H:true; // --- Nenhuma Criptografia Hidden
            // WIFI:T:nopass;S:fabio;P:1234565;H:;     // --- Nenhuma Criptografia
            
            const wifi_string = `WIFI:T:${params.type};S:${params.name};P:${params.pass};H:${params.hide.toString()};`;
            image.string = wifi_string;
            
            QRCode.toDataURL(wifi_string, async function (err, data) {
    
                if(!err) {
                    image.success = true;
                    image.qrcode  = data;
                }
                
                res.json(image);
            });
        }
        else if(type == 'WhatsApp')
        {
            // https://NOME-RESTAURANTE.gestorvirtual.net.br/whatsapp-me
            const url_wpp = `${process.env.APPURL || config.system.url}/whatsapp-me`;
            image.string = url_wpp;

            QRCode.toDataURL(url_wpp, async function (err, data) {
    
                if(!err) {
                    image.success = true;
                    image.qrcode  = data;
                }
                
                res.json(image);
            });
        }
        else if(type == 'mesa')
        {

        }
    }
    else 
    {
        res.json(image);
    }
}

module.exports = { getQrCode, getQrCodeData }