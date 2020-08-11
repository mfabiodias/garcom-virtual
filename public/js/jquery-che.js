let user_order;
let user_hash;

$(document).ready(function() {
    
    const socket = io(); 
    
    // Recupera lista de pedidos entre sessoões
    try { 
        user_order = JSON.parse(sessionStorage.getItem("checkout_items"));
        user_order = !!user_order && !!user_order.length ? user_order : [];
        // console.log('sessionStorage', user_order);
    } 
    catch(e) {
        try { 
            user_order = JSON.parse(localStorage.getItem("checkout_items"));
            user_order = !!user_order && !!user_order.length ? user_order : [];
            // console.log('localStorage', user_order);
        } 
        catch(e) { my_alert("Seu navegador é muito antigo e incompatível com nosso sistema de pedidos.😔"); }
    }
    finally{ printCart(user_order) }

    // Recupera hash do usuário entre sessoões
    try { 
        user_hash = JSON.parse(sessionStorage.getItem("user_hash"));
        user_hash = !!user_hash ? user_hash : "MTAwMS0w+RQZjRGY";
        // console.log('sessionStorage', user_hash);
    } 
    catch(e) {
        try { 
            user_hash = JSON.parse(localStorage.getItem("user_hash"));
            user_hash = !!user_hash ? user_hash : "MTAwMS0w+RQZjRGY";
            // console.log('localStorage', user_hash);
        } 
        catch(e) { my_alert("Seu navegador é muito antigo e incompatível com nosso sistema de pedidos.😔"); }
    }
    finally{ $(".user-hash").attr('href', `/pedidos/${user_hash}`); }

    // Padroniza altura dos box de cada produto
    let box_height = 0;
    $('.item-list .media-body').each(function(e)
    {	
      if(Math.ceil($(this).height()) > box_height) box_height = Math.ceil($(this).height());
    });
    
    $('.item-list .media-body').height(box_height);

    $("#sidebar").mCustomScrollbar({
        theme: "minimal"
    });

    $('#dismiss, .overlay').on('click', function () {
        $('#sidebar').removeClass('active');
        $('.overlay').removeClass('active');
    });

    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').addClass('active');
        $('.overlay').addClass('active');
        $('.collapse.in').toggleClass('in');
        $('a[aria-expanded=true]').attr('aria-expanded', 'false');
    });

    $('#itemModalOpenHour').on('click', function () {

        let data = $('.open-hour').attr('data-weekdata');

        try {
            data = JSON.parse(data);

            if(!!data['seg']['open'] && !!data['seg']['close']) {
                $('#seg_open').text(`Das ${data['seg']['open']} as ${data['seg']['close']}`);
            } else {
                $('#seg_open').text(`Fechado`);
            }

            if(!!data['ter']['open'] && !!data['ter']['close']) {
                $('#ter_open').text(`Das ${data['ter']['open']} as ${data['ter']['close']}`);
            } else {
                $('#ter_open').text(`Fechado`);
            }

            if(!!data['qua']['open'] && !!data['qua']['close']) {
                $('#qua_open').text(`Das ${data['qua']['open']} as ${data['qua']['close']}`);
            } else {
                $('#qua_open').text(`Fechado`);
            }

            if(!!data['qui']['open'] && !!data['qui']['close']) {
                $('#qui_open').text(`Das ${data['qui']['open']} as ${data['qui']['close']}`);
            } else {
                $('#qui_open').text(`Fechado`);
            }

            if(!!data['sex']['open'] && !!data['sex']['close']) {
                $('#sex_open').text(`Das ${data['sex']['open']} as ${data['sex']['close']}`);
            } else {
                $('#sex_open').text(`Fechado`);
            }

            if(!!data['sab']['open'] && !!data['sab']['close']) {
                $('#sab_open').text(`Das ${data['sab']['open']} as ${data['sab']['close']}`);
            } else {
                $('#sab_open').text(`Fechado`);
            }

            if(!!data['dom']['open'] && !!data['dom']['close']) {
                $('#dom_open').text(`Das ${data['dom']['open']} as ${data['dom']['close']}`);
            } else {
                $('#dom_open').text(`Fechado`);
            }

        } catch (e) { 
            $('#seg_open').text(`Fechado`);
            $('#ter_open').text(`Fechado`);
            $('#qua_open').text(`Fechado`);
            $('#qui_open').text(`Fechado`);
            $('#sex_open').text(`Fechado`);
            $('#sab_open').text(`Fechado`);
            $('#dom_open').text(`Fechado`);
        }

        $('#itemModal').modal('hide');
        $('#itemOpen').modal('show');
    });


    // Preenche modal do item dos dados do produto acionado
    $('#itemModal').on('show.bs.modal', function (event) 
    {
        const button      = $(event.relatedTarget);
        const tabid       = button.data('tabid'); 
        const product     = $(`#product-name-${tabid}`).val();
        const price       = $(`#product-price-${tabid}`).val();
        const image       = $(`#product-image-${tabid}`).val();
        const description = $(`#product-description-${tabid}`).val();
        
        cleanInput();
        if(!!user_order.length) findProduct(user_order, tabid);

        $("#itemModalId").val(tabid);
        $("#itemModalName").val(product);
        $("#itemModalPrice").val(price);
        $("#itemModalTitle").html(`<h5>${product}</h5>`);
        $("#itemModalImage").html(`<img src="${image}" alt="${product}" title="${product}" class="img-fluid" style="min-height: 220px!important; max-height: 220px!important;">`);
        $("#itemModalDescription").html(`${description}`);

        // Envia post para contabilizar
        // http://localhost:3009/api/product-view/3

        const url  = `/api/product-view/${tabid}`;
        apiPageData("GET", url, {});
    });

    // Adiciona item ao carrinho
    $("#itemModalAdd").on('click', function() {
        const id    = $("#itemModalId").val();
        const name  = $("#itemModalName").val();
        const qty   = $("#itemModalQty").val();
        const price = $("#itemModalPrice").val();
        const note  = $("#itemModalNote").val();
    
        if(!!user_order && !!user_order.find(el => el.id == id)) 
        {    
            user_order = user_order.map(el => { 
                if(el.id == id) {
                    el.qty   = qty;
                    el.price = price;
                    el.note  = note;
                }
                return el;
            });
        }
        else 
        {
            user_order.push({id, name, qty, price, note});
        }
    
        $("#itemModalClose").trigger( "click" );
    
        printCart(user_order);
        
        // console.log(user_order);
    });
    
    // Diminui qtd de um item ou remove do carrinho se qtd menor que uma
    $("#itemModalMinus").on('click', function() {
        let qty = $("#itemModalQty").val();
        
        if(qty > 1) qty--;
        else qty = 1;
    
        $("#itemModalQty").val(qty);
    });
    
    // Incrementa qtd do item no carrinho
    $("#itemModalPlus").on('click', function() {
        let qty = $("#itemModalQty").val();
        // console.log(qty)
        qty++;
        
        $("#itemModalQty").val(qty);
    });
    
    $('.cart-list').on('click', '.btn-change', function() {
        const tabid = $(this).attr('data-tabid');
        const type  = $(this).attr('data-type');
    
        const product = user_order.find(el => el.id == tabid);
    
        if(!!product)
        {
            if(type == 'plus')
            {
                user_order = user_order.map(el => { 
                    if(el.id == tabid) {
                        el.qty = parseInt(el.qty)+1;
                    }
                    return el;
                });
            }
            else if(type == 'minus')
            {
                // Remove itens que só tinha 1 qtd
                user_order = user_order.filter(el => el.id != tabid || (el.id == tabid && el.qty > 1) );
                
                // Diminui qtd do item caso qtd > 1
                user_order = user_order.map(el => { 
                    if(el.id == tabid && el.qty > 1) {
                        el.qty = parseInt(el.qty)-1;
                    }
                    return el;
                });
            }
        }
    
        printCart(user_order);
        
    });

    // Ref.: https://codepen.io/nhembram/pen/PzyYLL
    $('#itemModal').on('show.bs.modal', function (e) {
        testAnim("zoomIn");
    });

    // Ref.: https://codepen.io/nhembram/pen/PzyYLL
    $('#itemModal').on('hide.bs.modal', function (e) {
        testAnim("zoomOut");
    });


    $("#inputMethod").on('change', function() {
        if($(this).val() == 'entregar') {
            enableAddress();
        } else {
            disableAddress();
            printCart(user_order);
        }
    });
    
    $("#inputPayment").on('change', function() {

        if($(this).val() == 'dinheiro') 
        {
            $('.line-resize').removeClass("col-lg-6").addClass("col-lg-4");
            $('.payinfo').show();
        }
        else 
        {
            $('.line-resize').removeClass("col-lg-4").addClass("col-lg-6");
            $('.payinfo').hide();
            $('#inputObs').val("");

            if($(this).val() == 'online') 
            {
                $("#checkout_payment").show();
        
                $('#cardName').attr('required', 'required');
                $('#cardNumber').attr('required', 'required');
                $('#cardExpire').attr('required', 'required');
                $('#cardCVV').attr('required', 'required');
            }
            else 
            {
                $("#checkout_payment").hide();
        
                $('#cardName').removeAttr('required');
                $('#cardNumber').removeAttr('required');
                $('#cardExpire').removeAttr('required');
                $('#cardCVV').removeAttr('required');
            }
        }
        
    });
    
    $("#cardName").on('focus', function() {
        $('#cardImage').attr('src','/image/card-front-name.png');
    });
    
    $("#cardNumber").on('focus', function() {
        $('#cardImage').attr('src','/image/card-front-number.png');
    });
    
    $("#cardExpire").on('focus', function() {
        $('#cardImage').attr('src','/image/card-front-expire.png');
    });
    
    $("#cardCVV").on('focus', function() {
        $('#cardImage').attr('src','/image/card-back-cvv.png');
    });
    
    $("#cardName, #cardNumber, #cardExpire, #cardCVV").on('blur', function() {
        $('#cardImage').attr('src','/image/card-front.png');
    });
    
    $("#cardCVV, #cardNumber").on('keyup', function() {
        let val = $(this).val();
        val = val.replace(/[^0-9]/g,'');
        $(this).val(val);
    });
    
    $(function () {
        $('#cardDateTimePicker').datetimepicker({
            locale: 'pt-BR',
            viewMode: 'years',
            format: 'MM/YYYY'
        });
    });
    
    $("#cardNumber").on('blur', function() {
        let val = $(this).val();
        val = val.replace(/[^0-9]/g,'');
    
        console.log(val.length)
        
        if(val.length == 16)
        {
            $(this).val(mask(val, "#### #### #### ####"));
        }
    });
    
    $("#searchAddress").on('click', function() {
        
        const cep = $("#inputZip").val().trim();

        if(cep.length < 8) {
            my_alert('CEP inválido!');
        }
        else 
        {
            $("#inputAddress").val("...Aguarde");
            $("#inputNeighborhood").val("...Aguarde");
            $("#inputCity").val("...Aguarde");
            
            const url  = `/api/busca-cep/${cep}`;
            const data = apiPageData("GET", url, {});
            
            if(!!data.cep)
            {
                if(parseInt(data.limite) == -1)
                {
                    printCart([]);
                    cleanAddress();
                    my_alert(`Não conseguimos calcular a distância para seu CEP. Tente novamente e verifique o CEP informado. Persistindo o erro contante-nos`);
                }
                else if(parseInt(data.limite) == 0)
                {
                    printCart([]);
                    cleanAddress();
                    my_alert(`Seu endereço excede nosso raio de atuação 😔! Atendenmos em um raio de até ${data.limited}km e verificamos que seu endereço está a ${data.distance}km.`);
                }
                else
                {
                    $("#inputAddress").val(data.street);
                    $("#inputNeighborhood").val(data.neighborhood);
                    $("#inputCity").val(data.city);
                    $("#inputState").val(data.state);
                    $("#inputDistance").val(data.distance);
                    $("#inputDelivery").val(data.delivery);
    
                    saveAdrress(data);
                    printCart(user_order, data.delivery);
                }
            }
            else
            {
                my_alert(data.msg);
                
                $("#inputAddress").val("");
                $("#inputNeighborhood").val("");
                $("#inputCity").val("");
                $("#inputState").val("");
                $("#inputDistance").val(data.distance);
                $("#inputDelivery").val("");
            }
        }
    });

    $(".btn-menu").on('click', function() {
        menuActive(this);
    });


    // preparar
    $('#checkout_finish').on('click', function() {
        const inputData = encodeURIComponent(JSON.stringify({
            client: {
                name:   $("#inputName").val(),
                number: $("#inputWhatsappDDD").val()+$("#inputWhatsappNumber").val()
            },
            delivery: {
                zip:          $("#inputZip").val(),
                street:       $("#inputAddress").val(),
                number:       $("#inputNumber").val(),
                complement:   $("#inputComplement").val(),
                reference:    $("#inputReference").val(),
                neighborhood: $("#inputNeighborhood").val(),
                city:         $("#inputCity").val(),
                state:        $("#inputState").val(),
                distance:     $("#inputDistance").val()
            },
            order: { 
                delivery: $("#inputDelivery").val(),
                method:   $("#inputMethod").val(),
                payment:  $("#inputPayment").val(),
                obs:      $("#inputObs").val()
            },
            item: user_order
        }));

        const checkData = validateCheckout(inputData);

        if(checkData !== true) {
            my_alert(checkData);
        }
        else 
        {
            url    = `/api/order`;
            type   = "POST";
    
            const data = apiPageData(type, url, { data: inputData });
                
            if(data.success == true)
            {
                // Notificar ADMIN do restaurante para imprimir comanda
                socket.emit('send_command', data.order_id); 
                
                printCart([]);

                sessionStorage.setItem("user_hash", JSON.stringify(data.user_hash));
                localStorage.setItem("user_hash", JSON.stringify(data.user_hash));
                
                my_alert(`Seu pedido Num.: ${data.order_label} foi realizado com sucesso!\n\nNosso tempo médio de entrega é de ${data.order_wait} minutos.`);

                window.open(`/pedidos/${data.user_hash}`, '_self');
            }
            else
            {
                my_alert('Tivemos um problema para finalizar seu pedido! Tente novamente');
                // my_alert(JSON.stringify(data));
            } 
        }
    });

    // Auxiliar para fechar menu lateral no mobile ao clicar em qq lugar
    $('.container, .container-fluid, .row').on('click', function() {
        if($("#main-sidebar-container").hasClass("show")) $("#main-sidebar-container").removeClass("show");
    });

    // Imprime itens dos pedidos no modal
    $(".print-order-list").on('click', function() {

        const order    = $(this).attr("data-order");
        const date     = $(this).attr("data-date");
        const status   = $(this).attr("data-status");
        const delivery = $(this).attr("data-delivery");
        const discount = $(this).attr("data-discount");
        let items      = JSON.parse(decodeURIComponent($(this).attr("data-items")));

        $('.print-order-number').text(order);
        $('.print-order-date').text(date);
        $('.print-order-status').text(status);
        
        $('#print-order-list tbody').empty();
        $('#print-order-list tfoot').empty();

        let total = parseFloat(delivery) + parseFloat(discount)
        
        items.forEach(el => { 

            total += parseFloat(el.qty) * parseFloat(el.price);

            $("#print-order-list tbody").append(`
                <tr>
                    <td class="align-middle text-right">${el.qty}</td>
                    <td class="align-middle">X</td>
                    <td class="align-middle">
                        <div>${el.name || 'Produto - '+ el.id}</div>
                        <small class="form-text text-muted">${!!el.note.length ? 'Obs: '+el.note : ''}</small>
                    </td>
                    <td class="align-middle text-right">${parseFloat(el.price).toFixed(2).replace('.',',')}</td>
                    <td class="align-middle text-right">${(parseFloat(el.qty) * parseFloat(el.price)).toFixed(2).replace('.',',')}</td>
                </tr>
            `);
        });

        $("#print-order-list tfoot").append(`
            <tr>
                <th colspan="4" class="text-right">Entrega: </th>
                <th class="text-right">${parseFloat(delivery).toFixed(2).replace('.',',')}</th>
            </tr>
            <tr>
                <th colspan="4" class="text-right text-danger">Desconto: </th>
                <th class="text-right text-danger">${parseFloat(discount).toFixed(2).replace('.',',')}</th>
            </tr>
            <tr>
                <th colspan="4" class="text-right">Total: </th>
                <th class="text-right">${total.toFixed(2).replace('.',',')}</th>
            </tr>
        `);

    });

});




$(window).on('load', function() {

    if($("#inputMethod").val() == 'entregar') {

        enableAddress();
    }
});




(async () => {
    while(true) {
        // Executa loop a cada 10 segundos para buscar novos registros para trabalhar
        await new Promise(resolve => { setTimeout(resolve, 30000) });

        let data     = $('.open-hour').attr('data-weekdata');
        const week   = $('.open-hour').attr('data-weekday');
        const status = $('.open-hour').attr('data-status');

        // Limpa carrinho se restaurante esta fechado
        if(!!status && status != 'true' && !!user_order.length) {
            printCart([]);
            window.open(window.location.href, '_self');
        }
       
        if(!!data && !!week && !!status) 
        {
            const date  = new Date();
            const now   = `${date.getHours()}:${date.getMinutes()}`;

            try {
                
                data = JSON.parse(data);

                const start = !!data[week] && !!data[week]['open'] ? data[week]['open'] : "";
                const end   = !!data[week] && !!data[week]['close'] ? data[week]['close'] : "";

                if(!start || !end || (!!start && !!end && (now < start || now > end)))
                {
                    printCart([]);

                    if(status == 'true') {
                        window.open(window.location.href, '_self');
                    }
                    console.log(`FECHADO - NOW ${now} START ${start} END ${end}`);
                }

            } catch (e) {
                console.log("Falha ao converter JSON de horário de atendimento", data);
            }
        }
    }
})();




function saveAdrress(data)
{
    address_save = {
        zip: data.cep,
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        distance: data.distance,
        delyvery: data.delivery
    }

    sessionStorage.setItem("checkout_address", JSON.stringify(address_save));
    localStorage.setItem("checkout_address", JSON.stringify(address_save));
}

function cleanAddress()
{
    $("#inputZip").val("");
    $("#inputAddress").val("");
    $("#inputNumber").val("");
    $("#inputNeighborhood").val("");
    $("#inputCity").val("");
    $("#inputState").val("");
    $("#inputDistance").val("");
    $("#inputDelivery").val("");
}

function recoverAdrress()
{
    recAdrress = 0;
    
    try { 
        address = JSON.parse(sessionStorage.getItem("checkout_address"));
        address = !!address ? address : {};
    } 
    catch(e) {
        try { 
            address = JSON.parse(localStorage.getItem("checkout_items"));
            address = !!address ? address : {};
        } 
        catch(e) { my_alert("Seu navegador é muito antigo e incompatível com nosso sistema de pedidos.😔"); }
    }
    finally { 

        if(!!address.zip) 
        {
            $("#inputZip").val(address.zip);
            $("#inputAddress").val(address.street);
            $("#inputNeighborhood").val(address.neighborhood);
            $("#inputCity").val(address.city);
            $("#inputState").val(address.state);
            $("#inputDistance").val(address.distance);
            $("#inputDelivery").val(address.delivery);

            distance = parseInt(address.distance);

            recAdrress = {
                zip: address.zip,
                street: address.street,
                neighborhood: address.neighborhood,
                city: address.city,
                state: address.state,
                distance: address.distance,
                delyvery: address.delivery
            }
        }
    }

    return recAdrress;
}

function menuActive(id) {
    $(".btn-menu").removeClass('active');
    $(id).addClass('active');
}

function cleanInput()
{
    $('#itemModalId').val('');
    $('#itemModalNote').val('');
    $('#itemModalQty').val("1");
}

function findProduct(user_order, id)
{
    let product = user_order.find(el => el.id == id);
    if(!!product) {
        $('#itemModalNote').val(product.note);
        $('#itemModalQty').val(product.qty);
    }
}

function mask(val, mask)
{        
    val = val.trim();
    if(!val) return val;
    
    /*
    Examples:
    mask($cnpj, '##.###.###/####-##');
    mask($cpf , '###.###.###-##');
    mask($cep , '#####-###');
    mask($data, '##/##/####');
    mask($whats, '(##) #####-####');
    */
    
    maskared = '';
    k = 0;
    
    for(let i = 0; i<=mask.length-1; i++)
    {
        if(mask[i] == '#' && !!val[k]) maskared = maskared+val[k++];
        else if(!!mask[i]) maskared = maskared+mask[i];
    }
    
    return maskared;
}

function apiPageData(type, url, data)
{
    let result = '';

    headers = {"user-app": "79878979"};

    $.ajax
    ({
        type: type,
        url: url,
        headers,
        dataType: 'json',
        async: false,
        data: data,
        success: function (rtn) { result = rtn; }
    });

    return result;
}

function printCart(data, delivery)
{
    let valor_total = 0;
    $(".cart-list").html("");

    if(!!data && !!data.length) 
    {    
        let qty_items = 0;

        $(".cart-empty").hide();
        $(".cart-btn").show();
        
        $.each(data, function( index, obj ) { 
            qty_items += parseInt(obj.qty);

            let qty_price = parseFloat(obj.qty) * parseFloat(obj.price);
            valor_total += qty_price;
            qty_price = qty_price.toFixed(2).replace('.',',');
            
            $(".cart-list").append(`
                <li class="list-group-item ">
                    <div class="row">
                        <div class="col-8">
                            <h6 class="my-0 small">${obj.qty} x ${obj.name}</h6>
                            <div class="btn-group mr-auto" role="group">
                                <button type="button" class="btn btn-sm btn-outline-danger btn-change btn-minus" data-tabid="${obj.id}" data-type="minus">-</button>
                                <button type="button" class="btn btn-sm btn-outline-danger btn-change btn-plus" data-tabid="${obj.id}" data-type="plus">+</button>
                            </div>
                        </div>
                        <div class="col-4 text-right">
                            <span class="text-muted small">R$ ${qty_price}</span>
                        </div>
                    </div>
                </li>
            `);
        });

        $("#cart-qty").addClass('pt-2');
        $("#cart-qty").html(`
            <span class="d-block d-lg-none p1 pt-1 fa-stack fa-lg has-badge" data-count="${qty_items}">
                <a href="/carrinho" class="fas fa-shopping-basket fa-stack-1x text-white"></a>
            </span>
        `);

        
        let ship_price = 0;
        if(!!delivery)
        {
           ship_price = parseFloat(delivery);

            $(".cart-list").append(`
                <li class="list-group-item text-success bg-light d-flex justify-content-between">
                    <span>Taxa Entrega</span>
                    <strong>R$ ${ship_price.toFixed(2).replace('.', ',')}</strong>
                </li>
            `);
        }

        valor_total = valor_total + ship_price;
        valor_total = valor_total.toFixed(2).replace('.',',');
        $(".cart-list").append(`
            <li class="list-group-item d-flex justify-content-between">
                <span>Total</span>
                <strong>R$ ${valor_total}</strong>
            </li>
        `);

        sessionStorage.setItem("checkout_items", JSON.stringify(user_order));
        localStorage.setItem("checkout_items", JSON.stringify(user_order));
    }
    else 
    {
        $(".cart-empty").show();
        $(".cart-btn").hide();
        $("#cart-qty").removeClass('pt-2');
        $("#cart-qty").html(`<a href="/carrinho" class="d-block d-lg-none fas fa-shopping-basket fa-lg pt-4 mx-2 menulink"></a>`);
        
        sessionStorage.setItem("checkout_items", JSON.stringify([]));
        localStorage.setItem("checkout_items", JSON.stringify([]));
    }
}

function validateCheckout(inputData)
{
    let checkData = JSON.parse(decodeURIComponent(inputData));

    if(!checkData.client.name.trim()) { 
        return `Você deve informar "Seu Nome" para realizar seu pedido!`;
    }
    else if((checkData.client.name.trim().split(' ')).length < 2) {
        return `Você deve informar "Seu Nome Completo" para realizar seu pedido!`;
    }
    else if((checkData.client.number.trim().replace(/[^0-9]/g,'')).length < 10) {
        return `Você deve informar "Seu Número de Whatsapp/Celular" com DDD corretamente para realizar seu pedido!`;
    }
    else if(checkData.order.method == 'entregar' && (!checkData.delivery.zip.trim() 
        || !checkData.delivery.street.trim() || !checkData.delivery.number.trim() 
        || !checkData.delivery.neighborhood.trim() || !checkData.delivery.city.trim() 
        || !checkData.delivery.state.trim()
    )){
        return `Você deve informar "Seu Endereço" para realizar seu pedido! (Cep, Rua, Número, Bairro, Cidade e Estado são obrigatórios)`;
    }
    else if(checkData.order.method == 'entregar' && (!checkData.delivery.distance || parseInt(checkData.delivery.distance) < 0)) {
        return `Infelizmente não conseguimos calcular a distância para precificar sua entrega 😔!\n\nInforme corretamente seu CEP e clique no botão (LUPA) para calcularmos a distância de entrega.`;
    }

    return true;
}

function testAnim(x) {
    $('.modal .modal-dialog').attr('class', 'modal-dialog modal-dialog-centered modal-dialog-scrollable  ' + x + '  animated');
};

function enableAddress()
{
    $("#checkout_address").show();

    $('#inputCity').attr('required', 'required');
    $('#inputNeighborhood').attr('required', 'required');
    $('#inputNumber').attr('required', 'required');
    $('#inputAddress').attr('required', 'required');
    $('#inputZip').attr('required', 'required');
    $('#inputState').attr('required', 'required');
    $('#inputDistance').attr('required', 'required');
}

function disableAddress()
{
    $("#checkout_address").hide();
        
    $('#inputCity').removeAttr('required').val("");
    $('#inputNeighborhood').removeAttr('required').val("");
    $('#inputNumber').removeAttr('required').val("");
    $('#inputAddress').removeAttr('required').val("");
    $('#inputZip').removeAttr('required').val("");
    $('#inputState').removeAttr('required').val("");
    $('#inputDistance').removeAttr('required').val("");
    $('#inputDelivery').val("");
}