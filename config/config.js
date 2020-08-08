const host   = 'localhost';
const port   = process.env.MYPORT || 3009;
const path   = '';
const client = !!process.env.CLIENT ? "/"+process.env.CLIENT : "";
const url    = `http://${host}:${port}${path}`;
const api    = `http://${host}:${port}${path}/api`;
const admin  = `http://${host}:${port}${path}/admin`;
const image  = `http://${host}:${port}${path}/image`;

const fs = require("fs"); 

// Cria pastas de imagens do cliente se não existir
if (!fs.existsSync(process.cwd()+'/public/image/business'+client)) { fs.mkdirSync(process.cwd()+'/public/image/business'+client) }
if (!fs.existsSync(process.cwd()+'/public/image/campaign'+client)) { fs.mkdirSync(process.cwd()+'/public/image/campaign'+client) }
if (!fs.existsSync(process.cwd()+'/public/image/category'+client)) { fs.mkdirSync(process.cwd()+'/public/image/category'+client) }
if (!fs.existsSync(process.cwd()+'/public/image/message'+client))  { fs.mkdirSync(process.cwd()+'/public/image/message'+client) }
if (!fs.existsSync(process.cwd()+'/public/image/product'+client))  { fs.mkdirSync(process.cwd()+'/public/image/product'+client) }

// Cria pastas de botjson do cliente se não existir
if (!fs.existsSync(process.cwd()+'/whatsapp/bot'+client)) { fs.mkdirSync(process.cwd()+'/whatsapp/bot'+client) }



module.exports = {
    system: { host, url, api, admin, image, port },
    user: {
        name: "Food",
        logo: "no-logo.jpg" // only jpg/png
    },
    app: {
        name: "Gestor Virtual",
        since: 2019
    }
}