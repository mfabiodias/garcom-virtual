const fs      = require('fs');
const path    = require('path'); 
const helper  = require('../helpers');
const env     = require('../config/.env');
const config  = require('../config/config');
const model   = require('../models');
const jwt     = require('jsonwebtoken');
const session = require('sessionstorage');

const attr = {
    user: "",
    logo: "",
    page: "Login",
    title: "",
    business : {
        name: config.app.name,
        since: config.app.since
    }
};
 
async function getLogin(res, req) { 

    const getSession = JSON.parse(session.getItem('auth'));

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
    
    attr.user  = business.name;
    attr.title = `Login | ${business.name}`;
    attr.logo  = logo;

    attr.auth    = !!getSession && !!getSession.auth ? getSession.auth : false;
    attr.token   = !!getSession && !!getSession.token ? getSession.token : "";
    attr.message = !!getSession && !!getSession.message ? getSession.message : "";    
        
    res.render('./pages/admin/login', { helper, attr, business });
}

async function signIn(res, req) { 

    let business = await model.getBusiness();
    business = business[0][0];

    if(req.body.user == business.user && req.body.pass == business.pass) {
        auth    = true;
        token   = jwt.sign( { id:business.id }, env.jwt.secret, { expiresIn: 86400 }); // 1 Dia
        message = "Login realizado com sucesso!";
    }
    else {
        auth    = false;
        token   = "";
        message = "Usuário ou senha inválido!";
    }

    res.json({ auth, token, message });
}

async function signOut(res, req) {

    let business = await model.getBusiness();
    business = business[0][0];
    
    attr.user  = business.name;
    attr.title = `Login | ${business.name}`;

    attr.auth    = false;
    attr.token   = "";
    attr.message = "Usuário deslogado com sucesso!";

    session.setItem('auth', JSON.stringify(attr));
    
    res.redirect('/admin/login');
}

// Função de Autenticação 
async function verifyAuth(req, res, next) {

    let business = await model.getBusiness();
    business = business[0][0];
    
    attr.user  = business.name;
    attr.title = `Login | ${business.name}`;

    attr.token = req.cookies.authtoken;

    // console.log("Token", attr.token);
    
    if(!attr.token) 
    {
        attr.auth    = false;
        attr.token   = "";
        attr.message = "Realize seu Login para Acessar o Sistema";

        res.redirect('/admin/login');
    }
    else 
    {    
        jwt.verify(attr.token, env.jwt.secret, function(err, decoded) {

            // console.log("decode", decoded)
            if (!!err) {
    
                attr.auth    = false;
                attr.token   = "";
                attr.message = "Seu Login Expirou! Faço seu Login Novamente para Acessar o Sistema";

                session.setItem('auth', JSON.stringify(attr));
    
                res.redirect('/admin/login');
            }
            else {
                req.userId = decoded.id;
                next();
            }

        });
    }
}

module.exports = { getLogin, signIn, signOut, verifyAuth }