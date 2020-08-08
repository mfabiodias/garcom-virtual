const adresses      = require('./adresses');
const auth          = require('./auth');
const busca_cep     = require('./busca_cep');
const business      = require('./business');
const campaign      = require('./campaigns');
const category      = require('./categories');
const client        = require('./clients');
const employee      = require('./employees');
const home          = require('./home');
const image         = require('./images');
const mailing       = require('./mailings');
const message       = require('./messages');
const order         = require('./orders');
const qrcode        = require('./qrcodes');
const product       = require('./products');
const report        = require('./reports');
const user_checkout = require('./user_checkout');
const user_order    = require('./user_order');
const whatsapp      = require('./whatsapp');

module.exports = { 
    ...adresses,      ...auth,       ...busca_cep,  
    ...business,      ...campaign,   ...category,   
    ...client,        ...employee,   ...home,       
    ...image,         ...mailing,    ...order,    
    ...qrcode,        ...message,    ...product,    
    ...report,        
    ...user_checkout, ...user_order, ...whatsapp
}