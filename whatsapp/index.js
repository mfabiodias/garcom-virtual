const puppeteer = require('puppeteer-core');
const _cliProgress = require('cli-progress');
const spintax = require('mel-spintax');
require("./welcome");
var spinner = require("./step");
var utils = require("./utils");
var path = require("path");
var argv = require('yargs').argv;
var rev = require("./detectRev");
var constants = require("./constants");
var configs = require("./bot/bot");
var qrcode = require('qrcode');
const config = require('../config/config');

async function start(client, controller) {
    let outmsg;

    try {
        //console.log(configs);
        var page;
        await downloadAndStartThings(controller);
        var isLogin = await checkLogin();
        if (!isLogin) {
            await getAndShowQR();
        }
        if (configs.smartreply.suggestions.length > 0) {
            await setupSmartReply();
        }

        outmsg = "WhatsApp WEB sincronizado! Desfrute do seu ChatBot...";
        client.emit('whatsapp_msg', outmsg);
        client.emit('whatsapp_qrcode', 'success');
        console.log(outmsg);

    } catch (e) {

        outmsg = "Parece que ocorreu um erro: " + e;
        client.emit('whatsapp_msg', outmsg);
        console.error("\n" + outmsg);

        try {
            page.screenshot({ path: path.join(process.cwd(), "error.png") })
        } catch (s) {

            outmsg = "Can't create shreenshot, X11 not running?. " + s;
            console.error(outmsg);
        }
        console.warn(e);

        outmsg = "Don't worry errors are good. They help us improve. A screenshot has already been saved as error.png in current directory. Please mail it on mfabiodias@gmail.com along with the steps to reproduce it.\n";
        console.error(outmsg);
        throw e;
    }

    /**
     * If local chrome is not there then this function will download it first. then use it for automation. 
     */
    async function downloadAndStartThings() {

        await controller.getWhatsappMessages();
        const clientBotJSON = !!process.env.CLIENT ? `/whatsapp/bot/${process.env.CLIENT}/bot.json` : "/whatsapp/bot/bot.json";

        let botjson = utils.externalInjection(clientBotJSON);
        var appconfig = await utils.externalInjection(clientBotJSON);
        // let botjson = utils.externalInjection("bot.json");
        // var appconfig = await utils.externalInjection("bot.json");
        appconfig = JSON.parse(appconfig);

        
        outmsg = "Downloading chrome";
        client.emit('whatsapp_msg', outmsg);
        spinner.start(outmsg+"\n");

        const browserFetcher = puppeteer.createBrowserFetcher({
            path: process.cwd()
        });
        const progressBar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_grey);
        progressBar.start(100, 0);
        var revNumber = await rev.getRevNumber();
        const revisionInfo = await browserFetcher.download(revNumber, (download, total) => {
            //console.log(download);
            var percentage = (download * 100) / total;
            progressBar.update(percentage);
        });
        progressBar.update(100);

        outmsg = "Downloading chrome ... done!";
        spinner.stop(outmsg);

        outmsg = "Launching Chrome";
        spinner.start(outmsg);

        var pptrArgv = [];
        if (argv.proxyURI) {
            pptrArgv.push('--proxy-server=' + argv.proxyURI);
        }
        const extraArguments = Object.assign({});
        extraArguments.userDataDir = constants.DEFAULT_DATA_DIR;
        const browser = await puppeteer.launch({
            executablePath: revisionInfo.executablePath,
            headless: appconfig.appconfig.headless,
            userDataDir: path.join(process.cwd(), "ChromeSession"),
            devtools: false,
            args: [...constants.DEFAULT_CHROMIUM_ARGS, ...pptrArgv], ...extraArguments
        });

        outmsg = "Launching Chrome ... done!";
        spinner.stop(outmsg);

        if (argv.proxyURI) {
            spinner.info("Using a Proxy Server");
        }
        spinner.start("Opening Whatsapp");
        page = await browser.pages();
        if (page.length > 0) {
            page = page[0];
            page.setBypassCSP(true);
            if (argv.proxyURI) {
                await page.authenticate({ username: argv.username, password: argv.password });
            }
            page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36");
            await page.goto('https://web.whatsapp.com', {
                waitUntil: 'networkidle0',
                timeout: 0
            });
            //console.log(contents);
            //await injectScripts(page);
            botjson.then((data) => {
                page.evaluate("var intents = " + data);
                //console.log(data);
            }).catch((err) => {
                outmsg = "there was an error: " + err;
                console.log(outmsg);
            });

            outmsg = "Inicializando o Whatsapp ... Aguarde!";
            client.emit('whatsapp_msg', outmsg);
            client.emit('whatsapp_qrcode', 'start');
            spinner.stop(outmsg);

            page.exposeFunction("log", (message) => {
                console.log(message);
            })
            page.exposeFunction("getFile", utils.getFileInBase64);
            page.exposeFunction("resolveSpintax", spintax.unspin);
        }
    }

    // "1@auLbwyYiFZlePjnaMIEEbX11ZPwSd3AwXos8tAL1xIXBXlB+YyiJ1fAo,DbKWpUALxjrTIiAyD/3WREiVlpA9ndZML6R8Qtx7Pgc=,e6uU5yHEjZZvHeSQZt57ZA=="
    // "1@auLbwyYiFZlePjnaMIEEbX11ZPwSd3AwXos8tAL1xIXBXlB+YyiJ1fAo,DbKWpUALxjrTIiAyD/3WREiVlpA9ndZML6R8Qtx7Pgc=,e6uU5yHEjZZvHeSQZt57ZA=="

    async function injectScripts(page) {
        return await page.waitForSelector('[data-icon=laptop]')
            .then(async () => {
                page.evaluate(`const messageServerAPI = '${config.system.url}'`);
                var filepath = path.join(__dirname, "WAPI.js");
                await page.addScriptTag({ path: require.resolve(filepath) });
                filepath = path.join(__dirname, "inject.js");
                await page.addScriptTag({ path: require.resolve(filepath) });
                return true;
            })
            .catch(() => {
                outmsg = "Seu WhatsApp WEB não está conectado.\nEscsanei o QR Code para iniciar.";
                client.emit('whatsapp_msg', outmsg);
                console.log(outmsg);
                return false;
            })
    }

    async function checkLogin() {
        spinner.start("Page is loading");
        //TODO: avoid using delay and make it in a way that it would react to the event. 
        await utils.delay(10000);
        //console.log("loaded");
        var output = await page.evaluate("localStorage['last-wid']");
        //console.log("\n" + output);
        if (output) {
            outmsg = "Parece que seu WhatsApp WEB já está Conectado";
            client.emit('whatsapp_msg', outmsg);
            spinner.stop(outmsg);

            await injectScripts(page);
        } else {
            outmsg = "Seu WhatsApp WEB não está conectado.\nPor favor escaneio o QR Code para iniciar";
            client.emit('whatsapp_msg', outmsg);
            spinner.info(outmsg);
        }
        return output;
    }

    //TODO: add logic to refresh QR.
    async function getAndShowQR() {
        //TODO: avoid using delay and make it in a way that it would react to the event. 
        //await utils.delay(10000);
        var scanme = "img[alt='Scan me!'], canvas";
        await page.waitForSelector(scanme);
        var qrdata = await page.evaluate(`document.querySelector("${scanme}").parentElement.getAttribute("data-ref")`);
        // qrcode.generate(qrdata, { small: true });
        qrcode.toDataURL(qrdata, function (err, qrcode) {
            client.emit('whatsapp_qrcode', qrcode);
        });

        await page.evaluate(`
            let qrCodeStart = document.querySelector("img[alt='Scan me!'], canvas").parentElement.getAttribute("data-ref");
            let qrCodeRefresh;

            let observador = new MutationObserver(el => {
                el.forEach((mutation) => {
                    
                    if(!!document.querySelector("img[alt='Scan me!'], canvas"))
                    {
                        qrCodeRefresh = document.querySelector("img[alt='Scan me!'], canvas").parentElement.getAttribute("data-ref");
    
                        if(qrCodeStart != qrCodeRefresh){
                            qrCodeStart = qrCodeRefresh;
    
                            console.log('New qrCode:', qrCodeRefresh);
                            getQrCode(qrCodeRefresh);
                        }
    
                        // Click to restart random qrcode show
                        if(!!document.querySelector("img[alt='Scan me!'], canvas").parentElement.firstChild.firstChild){
                            console.log('Click to Restart qrcode Show');
                            document.querySelector("img[alt='Scan me!'], canvas").parentElement.firstChild.firstChild.click();
                        }
                    }
                });
            });

            observador.observe(document.querySelector("body"), { attributes: true, childList: true, subtree: true });
        `);

        // Qrcode refresh and print on CLI
        await page.exposeFunction('getQrCode', function(qrdata) {
            // qrcode.generate(qrdata, { small: true });
            outmsg = "Aguardando você escanear o QR Code";
            client.emit('whatsapp_msg', outmsg);
            spinner.start(outmsg);

            qrcode.toDataURL(qrdata, function (err, qrcode) {
                client.emit('whatsapp_qrcode', qrcode);
            });
        });

        // spinner.start("\n\nWaiting for scan \nKeep in mind that it will expire after few seconds\n\n");
        
        var isLoggedIn = await injectScripts(page);
        while (!isLoggedIn) {
            //console.log("page is loading");
            //TODO: avoid using delay and make it in a way that it would react to the event. 
            await utils.delay(300);
            isLoggedIn = await injectScripts(page);
        }
        if (isLoggedIn) {
            spinner.stop("Parece que você está conectado agora!");
            //console.log("Welcome, WBOT is up and running");
        }
    }

    async function setupSmartReply() {
        outmsg = "setting up smart reply";
        spinner.start(outmsg);

        await page.waitForSelector("#app");
        await page.evaluate(`
            var observer = new MutationObserver((mutations) => {
                for (var mutation of mutations) {
                    //console.log(mutation);
                    if (mutation.addedNodes.length && mutation.addedNodes[0].id === 'main') {
                        //newChat(mutation.addedNodes[0].querySelector('.copyable-text span').innerText);
                        console.log("%cChat changed !!", "font-size:x-large");
                        WAPI.addOptions();
                    }
                }
            });
            observer.observe(document.querySelector('.app'), { attributes: false, childList: true, subtree: true });
        `);

        outmsg = "setting up smart reply ... done!";
        spinner.stop(outmsg);

        page.waitForSelector("#main", { timeout: 0 }).then(async () => {
            await page.exposeFunction("sendMessage", async message => {
                return new Promise(async (resolve, reject) => {
                    //send message to the currently open chat using power of puppeteer 
                    await page.type("div.selectable-text[data-tab]", message);
                    if (configs.smartreply.clicktosend) {
                        await page.click("#main > footer > div.copyable-area > div:nth-child(3) > button");
                    }
                });
            });
        });
    }
}

module.exports = { start }
