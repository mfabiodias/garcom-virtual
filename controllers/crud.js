const controller = require('./');

const list = (res, req) => {
    if(req.params.table == 'campaign')      controller.getCampaigns(res, req)
    else if(req.params.table == 'category') controller.getCategories(res, req)
    else if(req.params.table == 'client')   controller.getClients(res, req)
    else if(req.params.table == 'employee') controller.getEmployees(res, req)
    else if(req.params.table == 'product')  controller.getProducts(res, req)
    else if(req.params.table == 'mailing')  controller.getMailings(res, req)
    else if(req.params.table == 'order')    controller.getOrders(res, req)
    else res.status(404).send('Page not found !');
};

const get = (res, req) => {
    if(req.params.table == 'address')       controller.getAddress(res, req.params.id)
    else if(req.params.table == 'campaign') controller.getCampaign(res, req.params.id)
    else if(req.params.table == 'category') controller.getCategory(res, req.params.id)
    else if(req.params.table == 'client')   controller.getClient(res, req.params.id)
    else if(req.params.table == 'employee') controller.getEmployee(res, req.params.id)
    else if(req.params.table == 'product')  controller.getProduct(res, req.params.id)
    else if(req.params.table == 'mailing')  controller.getMailing(res, req.params.id)
    else if(req.params.table == 'message')  controller.getMessage(res, req.params.id)
    else if(req.params.table == 'order')    controller.getOrder(res, req.params.id)
    else res.status(404).send('Page not found !');
};

const insert = (res, req) => {
    if(req.params.table == 'address')       controller.insertAddress(res, req.body)
    else if(req.params.table == 'campaign') controller.insertCampaign(res, req.body)
    else if(req.params.table == 'category') controller.insertCategory(res, req.body)
    else if(req.params.table == 'client')   controller.insertClient(res, req.body)
    else if(req.params.table == 'employee') controller.insertEmployee(res, req.body)
    else if(req.params.table == 'product')  controller.insertProduct(res, req.body)
    else if(req.params.table == 'mailing')  controller.insertMailing(res, req.body)
    else if(req.params.table == 'message')  controller.insertMessage(res, req.body)
    else if(req.params.table == 'order')    controller.insertOrder(res, req.body)
    else res.status(404).send('Page not found !');
};

const update = (res, req) => {
    if(req.params.table == 'address')       controller.updateAddress(res, req.params.id, req.body)
    else if(req.params.table == 'business') controller.updateBusiness(res, req.params.id, req.body)
    else if(req.params.table == 'campaign') controller.updateCampaign(res, req.params.id, req.body)
    else if(req.params.table == 'category') controller.updateCategory(res, req.params.id, req.body)
    else if(req.params.table == 'client')   controller.updateClient(res, req.params.id, req.body)
    else if(req.params.table == 'employee') controller.updateEmployee(res, req.params.id, req.body)
    else if(req.params.table == 'product')  controller.updateProduct(res, req.params.id, req.body)
    else if(req.params.table == 'mailing')  controller.updateMailing(res, req.params.id, req.body)
    else if(req.params.table == 'message')  controller.updateMessage(res, req.params.id, req.body)
    else if(req.params.table == 'whatsapp') controller.updateWhatsapp(res, req.params.id, req.body)
    else res.status(404).send('Page not found !');
};

const remove = (res, req) => {
    if(req.params.table == 'address')       controller.deleteAddress(res, req.params.id)
    else if(req.params.table == 'category') controller.deleteCategory(res, req.params.id)
    else if(req.params.table == 'campaign') controller.deleteCampaign(res, req.params.id)
    else if(req.params.table == 'category') controller.deleteCategory(res, req.params.id)
    else if(req.params.table == 'client')   controller.deleteClient(res, req.params.id)
    else if(req.params.table == 'employee') controller.deleteEmployee(res, req.params.id)
    else if(req.params.table == 'product')  controller.deleteProduct(res, req.params.id)
    else if(req.params.table == 'mailing')  controller.deleteMailing(res, req.params.id)
    else if(req.params.table == 'message')  controller.deleteMessage(res, req.params.id)
    else res.status(404).send('Page not found !');
};

module.exports = { list, get, insert, update, remove }