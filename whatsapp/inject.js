WAPI.waitNewMessages(false, async (data) => {
    for (let i = 0; i < data.length; i++) {
        //fetch API to send and receive response from server
        let message = data[i];
        body = {};
        body.text = message.body;
        body.type = 'message';
        body.user = message.chatId._serialized;

        // Debug
        window.log(`MSG Type: ${message.type}`);
        window.log(`User: ${message.chatId._serialized}, Msg: ${message.body}`);
        window.log(`Checando mensagem de ${message.chatId.user}...`);
        
        // if (intents.blocked.indexOf(message.chatId.user) >= 0) {
        if (intents.blocked.includes(message.chatId.user.substr(2))) {
            window.log("number is blocked by BOT. no reply");
            return;
        }
        
        // Tipo de mensagem 
        if (message.type == "chat") 
        {
            // Verifica se msg é de um grupo e para execução se msg em grupo estiver desativada.
            if (message.isGroupMsg == true && intents.appconfig.isGroupReply == false) {
                window.log("Message received in group and group reply is off. so will not take any actions.");
                return;
            }

            // Verifica se existe mensagem com resposta exata ou parcial
            let getRequest = message.body.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
            let responseObj;
            await intents.bot.map(obj => {
                for (exact of obj.exact) {
                    if(!responseObj && getRequest == exact.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase()) {
                        responseObj = obj;
                    }
                }

                if(!responseObj) {
                    for (contains of obj.contains) {
                        if(!responseObj && getRequest == contains.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase()) {
                            responseObj = obj;
                        }
                    }
                }
            });

            // Armazena mensagem 
            var response = "";
            if (responseObj != undefined) {
                response = await resolveSpintax(responseObj.response);
                window.log(`Replying with ${response}`);
            } else {
                response = await resolveSpintax(intents.noMatch);
                window.log(`No exact match found. So replying with ${response} instead`);
            }
            
            // Envia a mensagem
            WAPI.sendSeen(message.chatId._serialized);
            WAPI.sendMessage2(message.chatId._serialized, response);
            
            // Envia arquivo se houver
            if (responseObj.file != undefined) {
                window.getFile(responseObj.file).then((base64Data) => {
                    WAPI.sendImage(base64Data, message.chatId._serialized, responseObj.file);
                }).catch((error) => {
                    window.log("Error in sending file\n" + error);
                })
            }
        }
    }
});

WAPI.addOptions = function () {
    var suggestions = "";
    intents.smartreply.suggestions.map((item) => {
        suggestions += `<button style="background-color: #eeeeee;
                                margin: 5px;
                                padding: 5px 10px;
                                font-size: inherit;
                                border-radius: 50px;" class="reply-options">${item}</button>`;
    });
    var div = document.createElement("DIV");
    div.style.height = "40px";
    div.style.textAlign = "center";
    div.style.zIndex = "5";
    div.innerHTML = suggestions;
    div.classList.add("grGJn");
    var mainDiv = document.querySelector("#main");
    var footer = document.querySelector("footer");
    footer.insertBefore(div, footer.firstChild);
    var suggestions = document.body.querySelectorAll(".reply-options");
    for (let i = 0; i < suggestions.length; i++) {
        const suggestion = suggestions[i];
        suggestion.addEventListener("click", (event) => {
            console.log(event.target.textContent);
            window.sendMessage(event.target.textContent).then(text => console.log(text));
        });
    }
    mainDiv.children[mainDiv.children.length - 5].querySelector("div > div div[tabindex]").scrollTop += 100;
}
