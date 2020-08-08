const adresses   = require('./adresses_model');
const business   = require('./business_model');
const campaigns  = require('./campaigns_model');
const categories = require('./categories_model');
const clients    = require('./clients_model');
const employees  = require('./employees_model');
const message    = require('./message_model');
const mailings   = require('./mailings_model');
const orders     = require('./orders_model');
const products   = require('./products_model');
const reports    = require('./report_model');
const whatsapp   = require('./whatsapp_model');

module.exports = { 
    ...adresses, ...business,  ...campaigns, ...categories, 
    ...clients,  ...employees, ...message,   ...mailings,   
    ...orders,   ...products,  ...reports,   ...whatsapp
}