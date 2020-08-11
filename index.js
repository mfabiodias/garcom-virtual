// require("rimraf").sync('./chromium-data'+(!!process.env.CLIENT ? "/"+process.env.CLIENT : ""));
const express        = require('express');
const app            = require('express')();
const expressLayouts = require('express-ejs-layouts');
const server         = require('http').createServer(app);
const io             = require('socket.io')(server);
const bodyParser     = require('body-parser');
const controller     = require('./controllers');
const crud           = require('./controllers/crud');
const path           = require('path');
const open           = require('open');
const cors           = require('cors')
const config         = require('./config/config');
const cookieParser   = require('cookie-parser');
app.use(cookieParser());

// Função para CORS
const corsOptions = {
    origin: 'https://web.whatsapp.com',
    optionsSuccessStatus: 200 
}

// EJS Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Deifinições iniciais
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Routes for ADMIN Pages
app.use('/', expressLayouts); 
app.get('/admin',                  controller.verifyAuth, (req, res) => { controller.getHome(res, req, 'admin') });
app.get('/admin/categorias',       controller.verifyAuth, (req, res) => { controller.getCategories(res, req, 'admin') });
app.get('/admin/produtos',         controller.verifyAuth, (req, res) => { controller.getProducts(res, req, 'admin') });
app.get('/admin/pedidos',          controller.verifyAuth, (req, res) => { controller.getOrders(res, req, 'admin') });
app.get('/admin/funcionarios',     controller.verifyAuth, (req, res) => { controller.getEmployees(res, req, 'admin') });
app.get('/admin/clientes',         controller.verifyAuth, (req, res) => { controller.getClients(res, req, 'admin') });
app.get('/admin/lista-envio',      controller.verifyAuth, (req, res) => { controller.getMailings(res, req, 'admin') });
app.get('/admin/loja',             controller.verifyAuth, (req, res) => { controller.getBusiness(res, req, 'admin') });
app.get('/admin/qrcode',           controller.verifyAuth, (req, res) => { controller.getQrCode(res, req, 'admin') });
app.get('/admin/campanhas',        controller.verifyAuth, (req, res) => { controller.getCampaigns(res, req, 'admin') });
app.get('/admin/whatsapp',         controller.verifyAuth, (req, res) => { controller.getWhatsapp(res, req, 'admin') });
app.get('/admin/whatsapp-chatbot', controller.verifyAuth, (req, res) => { controller.getWhatsappChatBot(res, req, 'admin') });
app.get('/admin/relatorios',       controller.verifyAuth, (req, res) => { controller.getReport(res, req, 'admin') });

// Routes for login/out
app.post('/admin/auth', (req, res) => { controller.signIn(res, req)} );
app.get('/admin/login', (req, res) => { controller.getLogin(res, req)} );
app.get('/admin/logout', (req, res) => { controller.signOut(res, req)} );

// Routes for WhatsApp and Garçom Pages
app.get('/',              (req, res) => { controller.getProductList(res, req) });
app.get('/whatsapp-me',   (req, res) => { controller.getWhatsappME(res, req) });
app.get('/carrinho',      (req, res) => { controller.getUserCheckout(res, req) });
app.get('/pedidos/:user', (req, res) => { controller.getUserOrders(res, req) });
app.get('/:category',     (req, res) => { controller.getProductList(res, req) });

// Other API Specific Routes
app.post('/api/whatsapp-restart',       (req, res) => { controller.getWhatsappRestart(res, req) });
app.get('/api/order',                   (req, res) => { controller.getOrders(res, req) });
app.get('/api/product-view/:id',        (req, res) => { controller.updateVisited(res, req) });
app.get('/api/busca-cep/:cep',          (req, res) => { controller.getCepEndereco(res, req) });
app.post('/api/qrcode/:type',           (req, res) => { controller.getQrCodeData(res, req) });
app.post('/api/image/:table/:id/:name', (req, res) => { controller.saveImage(res, req) });

app.get('/api/campaign-messages', cors(corsOptions), (req, res) => {controller.getWhatsappCampaignMessages(res, req) });
app.get('/api/campaign-messages-status/:id/:status', cors(corsOptions), (req, res) => {controller.setWhatsappCampaignStatus(res, req) });

// Routes for API CRUD
app.get('/api/:table',        (req, res) => { crud.list(res, req) });
app.post('/api/:table',       (req, res) => { crud.insert(res, req) });
app.get('/api/:table/:id',    (req, res) => { crud.get(res, req) });
app.put('/api/:table/:id',    (req, res) => { crud.update(res, req) });
app.delete('/api/:table/:id', (req, res) => { crud.remove(res, req) });

// 404 Page
app.get('*', (req, res) => { res.status(404).send('Page not found!'); });

server.listen(config.system.port, () => { 
    console.log(`Servidor ativo em ${config.system.url}`);
    // open(config.system.admin);
});

io.on('connection', (client) => {
    // Reencaminha do cardapio para o ADMIN a comanda para imprimir
    client.on('send_command', (msg)=> { 
        // console.log('print_command', msg);
        client.broadcast.emit('print_command', msg);
    });

    client.on('send_whatsapp_msg', (msg)=> { 
        // console.log('print_command', msg);
        client.broadcast.emit('print_whatsapp_msg', msg);
    });

    client.on('send_whatsapp_qrcode', (msg)=> { 
        // console.log('print_command', msg);
        client.broadcast.emit('print_whatsapp_qrcode', msg);
    });

    // console.log('New Connection', client.id);
})
 
// // Inicializa script do WhatsApp de forma integrada
// const whatsapp = require('./whatsapp/index');
// whatsapp.start(io, controller);