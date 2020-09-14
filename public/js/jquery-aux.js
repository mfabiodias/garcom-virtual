$(document).ready(function() {

    let reload_require = false;

    let urlPath = window.location.pathname.split('/')[2];

    // Set active link page
    $('.curact').removeClass('active');
    $('.'+urlPath).addClass('active');
    
    // Inicializa DataTable on Page
    setDataTable('.datatable-option');
    setDataTable('.datatable-option2');
    
    // Print Order
    $('#orders-list').on('click', '.orderPrint', function() {

        $("#comanda").html("");
        
        const tab_id  = $(this).attr("data-tabid").trim() || "";
        
        printCommand(tab_id);
    });

    
    // Abre popover para inserir obs do item do pedido
    $('#order_item_list').on('click', '.popover_order', function() { 
        $(this).popover('toggle');
    });


    $('#order_item_list').on('change', '.order_item_qty', function() { 
        const qty   = $(this).val(); 
        const tabid = $(this).attr('data-idx'); 
        $(`#order_item_${tabid}`).attr('data-qty', qty);

        let qtyVal = parseFloat($(`#order_item_${tabid}`).attr('data-val') * qty);
        qtyVal = !!qtyVal ? qtyVal.toFixed(2).replace('.',',') : false;

        if(qtyVal !== false) {
            $(`#item_val_qty_${tabid}`).text(qtyVal);
        }

        printCart();
    });

    $('.discount_ipt, .delivery_ipt').on('change blur paste textInput input', function() { 
        printCart();
    });



    // Modal UPSERT All
    $('#modalUpsert').on('show.bs.modal', function (event) 
    {
        cleanInputForm('modal-form', true);

        const modal    = $(this);
        const button   = $(event.relatedTarget);
        const tab_id   = button.data('tabid');
        const tab_name = button.data('tabname');
        const tab_type = button.data('tabtype'); 
        const tab_crud = button.data('crud');
        const btn      = tab_crud == "update" ? "Atualizar" : "Cadastrar";
        const relation = button.data('belongsto'); 
        const rel_col  = button.data('belongstoid');

        if(relation != "") getBelongsTo(relation, rel_col);

        modal.find('.form_action_ipt').val(tab_crud);

        otherOptionsAll(tab_name);

        if(tab_crud == "update")
        {
            const url  = `/api/${tab_name}/${tab_id}`;
            const data = apiPageData("GET", url, {});

            $("#modal_submit span").text(btn);

            inputData(modal, data, "update", tab_name);
            otherOptionsUpdate(tab_name);
        }

        $("#modal_submit span").text(btn);
        $("#modalUpsertLabel span").text(`${btn} ${tab_type}`);
    });

    // Modal DELETE All
    $('#modalDelete').on('show.bs.modal', function (event) 
    {
        const modal    = $(this);
        const button   = $(event.relatedTarget);
        const tab_id   = button.data('tabid'); 
        const name     = button.data('name'); 
        const tab_name = button.data('tabname'); 
        const tab_type = button.data('tabtype'); 
        const tab_myid = button.data('myid'); 
        const url      = `/api/${tab_name}/${tab_id}`;

        $("#modalDelete #delete_id").val(tab_id);
        $("#modalDelete #delete_url").val(url);
        $("#modalDelete #delete_btn").val(tab_myid);
        $("#modalDelete #delete_type").val(tab_type);
        $("#modalDeleteLabel span").text(tab_type);
        $("#delete-msg").text(`Tem certeza que deseja excluir ${tab_type} ${!!name ? '"'+name+'"' : '"'+tab_id+'"'}?`);
    });

    // UPSERT ALL
    $('#modal_submit').on('click', function() 
    {
        // Evitar cclicar 2 vezes antes de finalizar POST/PUT
        if(!$(this).hasClass('disabled'))
        {
            $(this).addClass('disabled');
            $(this).prop('disabled', true);

            const inputData   = getInputValue("modal-form");
            const inputEmpty  = checkInputForm("modal-form");
            const tab_name    = $(this).attr('data-tabname');
            const tab_type    = $(this).attr('data-tabtype');
            const tab_addon   = $(this).attr('data-tabaddon');
            const refresh_wpp = $(this).attr('data-refreshwpp');
            const refresh_wpa = $(this).attr('data-refreshwpa');
    
            // console.log("refresh_wpp", refresh_wpp);
            // console.log("refresh_wpa", refresh_wpa);
            
            const action = $('#modal-form .form_action_ipt').val();
            const id_upt = $('#modal-form .id_ipt').val();
            
            if(inputEmpty.length <= 0)
            {
                let url    = "";
                let type   = "";
                let msg_ok = "";
                let msg_ng = "";
                
                if(action == 'update')
                {
                    url    = `/api/${tab_name + (!!tab_addon ? tab_addon : '')}/${id_upt}`;
                    type   = "PUT";
                    msg_ok = `${tab_type} ${!!inputData.name ? '"'+inputData.name+'"' : ""} atualizado com sucesso!`;
                    msg_ng = `Falha ao atualizar ${tab_type.toLowerCase()}, tente novamente!`;
                }
                else
                {
                    url    = `/api/${tab_name + (!!tab_addon ? tab_addon : '')}`;
                    type   = "POST";
                    msg_ok = `${tab_type} ${!!inputData.name ? '"'+inputData.name+'"' : ""} adicionado com sucesso!`;
                    msg_ng = `Falha ao adicionar ${tab_type.toLowerCase()}, tente novamente!`;   
                }
                
                const data = apiPageData(type, url, inputData);
                
                if(!!data.id)
                {
                    const imageName = !!data.name ? data.name : tab_name;
    
                    saveImage(tab_name, data.id, imageName);
    
                    if(!!data.error) msg_ok = data.error;
                    else if(!!data.msg) msg_ok = data.msg;
    
                    reload_require = true;
                    $('#my-alert-msg').removeClass('alert-danger d-none').addClass('alert-success d-block')
                        .text(msg_ok).fadeOut( 2000, "linear");
                        
                    // Auto refresh whatsapp ao cadastrar mensagens.
                    if(!!refresh_wpp) { 
                        refreshWpp(false);
                    }
                }
                else
                {
                    if(!!data.error) msg_ng = data.error;
                    else if(!!data.msg) msg_ng = data.msg;
                    
                    $('#my-alert-msg').removeClass('alert-success d-none').addClass('alert-danger d-block')
                        .text(msg_ng).fadeOut( 2000, "linear");
                }  
            }

            $(this).removeClass('disabled');
            $(this).prop('disabled', false);

            // if(action != 'update') {
            //     $("#modalUpsert").modal('hide')
            // }
        }

    });

    // DELETE ALL
    $("#delete_submit").on("click", function() {
        const id    = $("#delete_id").val();
        const url   = $("#delete_url").val();
        const btn   = $("#delete_btn").val();
        const table = $("#delete_type").val();

        const data  = apiPageData("DELETE", url, {});

        
        if(data.success)
        {
            const check = apiPageData("GET", url, {});
    
            if(!check.id)
            {
                reload_require = true;
            }
            
            $("#modalDelete").modal("hide");
            $(".reload_closed").trigger( "click" );
        }
        else 
        {
            $("#delete-msg").html(`<p class="font-weight-bold text-danger">${data.message}</p>`);
        }
    });

    // Order Modal
    $('#orderModal').on('show.bs.modal', function (event) 
    {
        const button   = $(event.relatedTarget);
        const order    = button.data('order'); 
        const items    = JSON.parse(decodeURIComponent(button.data('items'))); 
        const delivery = button.data('delivery'); 
        const discount = button.data('discount'); 
         
        let total    = 0;
        let prinModal = 
        '<table class="table table-sm table-hover">'+
            '<thead>'+
                '<tr>'+
                    '<th>SKU</th>'+
                    '<th>Item</th>'+
                    '<th>Valor</th>'+
                    '<th>Qtd.</th>'+
                    '<th>SubTotal</th>'+
                '</tr>'+
            '</thead>'+
            '<tbody>';
        
        $.each(items, function( index, item ) {
            total += (parseFloat(item.price)*parseFloat(item.qty));
            
            prinModal = prinModal +         
            '<tr>'+
                '<td>'+(item.id).toString().str_pad(3, "0", "left", "I")+'</td>'+
                '<td>'+
                    '<div>'+item.product+'</div>'+
                    '<small class="form-text text-muted">'+(!!item.note.length ? `Obs: ${item.note}` : '')+'</small>'+
                '</td>'+
                '<td class="text-right">'+item.price.toString().number_format(2,',','.')+'</td>'+
                '<td class="text-right">'+parseInt(item.qty)+'</td>'+
                '<td class="text-right">'+(item.price*item.qty).toString().number_format(2,',','.')+'</td>'+
            '</tr>';
        });

        prinModal = prinModal +         
            '</tbody>'+
            '<tfoot>'+
                '<tr>'+
                    '<th class="text-right" colspan="3"></th>'+
                    '<th class="text-right">SubTotal:</th>'+
                    '<th class="text-right">'+total.toString().number_format(2,',','.')+'</th>'+
                '</tr>'+
                '<tr>'+
                    '<th class="text-right" colspan="4">Entrega:</th>'+
                    '<th class="text-right">'+delivery.toString().number_format(2,',','.')+'</th>'+
                '</tr>'+
                '<tr class="text-danger">'+
                    '<th class="text-right" colspan="4">Desconto:</th>'+
                    '<th class="text-right">'+
                        (parseFloat(discount) > 0 ? "-" : "")+
                        discount.toString().number_format(2,',','.')+
                    '</th>'+
                '</tr>'+
                '<tr>'+
                    '<th class="text-right" colspan="4">Total:</th>'+
                    '<th class="text-right">'+(total+parseFloat(delivery)+parseFloat(discount)).toString().number_format(2,',','.')+'</th>'+
                '</tr>'+
            '</tfoot>'+
        '</table>';

        $("#orderSku").html(order.toString().str_pad(4, "0", "left", "P"));
        $("#orderItems").html(prinModal);
    
    });  
    
    
    // Preenche open list quando abrir modal
    $('#modalAddress').on('show.bs.modal', function (event) 
    {
        const button    = $(event.relatedTarget);
        const client_id = button.data('cliid');

        let adresses
        try {
            adresses = JSON.parse(decodeURIComponent(button.data('adresses'))); 
        } catch (error) {
            adresses = []
        }
        
        const select = $('#inputAdresses');

        $('#dataClientId').val(client_id);
        $('#dataAddress').val(JSON.stringify(adresses));

        select.empty();
        select.append('<option value="">Selecione um endereço para atualiza-lo.</option>');
        $.each(adresses, function( index, attr ) {
            select.append($('<option>', {
                value: attr.id,
                text: attr.label
            }));
        });
    });  

    $('#inputAdresses').on('change', function () {

        const address_id = $(this).val();
        const adresses = JSON.parse($('#dataAddress').val());

        if(!!address_id)
        {
            $("#upsertAddress").text('Atualizar');

            const adrress = adresses.find(el => el.id == address_id);
            adrress.client_id = $('#dataClientId').val();

            if(!!adrress.zip) { addInputAddress(adrress); }
            else { 
                cleanInputAddress();
                my_alert("Problema ao decodificar endereço");
            }
        }
        else
        {   
            $("#upsertAddress").text('Cadastrar');

            cleanInputAddress();
        }
        
    });

    $('#deleteAddress').on('click', function () 
    {
        const address_id = $('#inputAdresses').val();
        const url   = `/api/address/${address_id}`;

        if(!!address_id && confirm("Deseja realmente excluir este arquivo!"))
        {
            const data  = apiPageData("DELETE", url, {});
    
            if(data.success)
            {
                const check = apiPageData("GET", url, {});
        
                if(!check.id) { reload_require = true; }
                
                $(".reload_closed").trigger( "click" );
            }
            else 
            {
                my_alert(data.message);
            }
        }
    });

    $('#addClientAddress').on('click', function () {
        if(!$('#dataClientId').find(':selected').val()){
            my_alert("Selecione um cliente para adicionar um novo endereço!");
        } else {
            $("#modalOrderAddress").modal('show');
        }
    });

    $('#upsertAddress').on('click', function () 
    {
        const address_id = $('#inputAdresses').val();
        const client_id  = $("#dataClientId").val();
        const address = { 
            client_id,
            zip:          $("#inputZip").val().trim().replace(/[^0-9]/g,''),
            street:       $("#inputAddress").val().trim(),
            number:       $("#inputNumber").val().trim(),
            complement:   $("#inputComplement").val().trim(),
            reference:    $("#inputReference").val().trim(),
            neighborhood: $("#inputNeighborhood").val().trim(),
            city:         $("#inputCity").val().trim(),
            state:        $("#inputState").val().trim()
        };

        const noRefresh = $("#noRefresh").val().trim();
        const validator = validateAddress(address);

        if(!!validator){
            my_alert(validator);
        }
        else 
        {
            if(!!address_id)
            {
                url  = `/api/address/${address_id}`;
                data = apiPageData("PUT", url, address);
            }
            else 
            {
                url  = `/api/address`;
                data = apiPageData("POST", url, address);
            }
    
            my_alert(data.message);

            if(!!noRefresh && noRefresh == 'true') {
                mountClientAdrressOption(client_id);
                $("#modalOrderAddress").modal('hide');
                $('.address_id_ipt').val(data.id);
                $('.selectpicker').selectpicker('refresh'); // Para atualizar selectpicker

                const cep = $('.address_id_ipt').find(':selected').attr('data-zip');
                deliveryDistance(cep);
            }
            else {
                $(".reload_closed").trigger( "click" );
            }
        }
    });

    // Preenche open list quando abrir modal
    $('#modalOpen').on('show.bs.modal', function (event) 
    {
        time_list = insertOpenTime();
        showOpenTime(time_list);
    });

    // Preenche open list quando iniciar a página
    if(window.location.pathname == '/admin/loja')
    {
        time_list = insertOpenTime(true);
        showOpenTime(time_list);
    }

    // Reload Page 
    $('.reload_closed').on('click', function () {
        // if(reload_require) window.location.reload(true); 

        window.open(window.location.href, '_self');
    });

    // Funcionalidade para un/check  
    $('.client_list_opt').on('change', function () {
        
        $('#type_list').val($(this).val());

        if($(this).val() == 'selected') 
        {
            cleanClientList();
            $('#table-client-list').show();
        }
        else {
            
            $('#client_list').val(JSON.stringify([]));
            $('#table-client-list').hide();
        }
    });

    $('.checked-all').on('click', function () {

        const client_list = [];

        $('.checked-all').each(function(e) {	    
            if($(this).prop('checked')) {
                client_list.push(parseInt($(this).attr('data-clid')));
            }
        });

        $('#client_list').val(JSON.stringify(client_list));
    });

    $('#open_time_save').on('click', function () {

        const time_list = { 
            seg : { open: "", close: "" }, 
            ter : { open: "", close: "" }, 
            qua : { open: "", close: "" }, 
            qui : { open: "", close: "" }, 
            sex : { open: "", close: "" }, 
            sab : { open: "", close: "" }, 
            dom : { open: "", close: "" }
        };

        $('.work-time-check').each(function(e) {	    
           
            getType    = $(this).attr("data-type");
            getWeekday = $(this).attr("data-weekday");

            time_list[getWeekday][getType] = $(this).val().trim();
        });

        checkOpenTime(time_list);

        $('.open_ipt').val(JSON.stringify(time_list));
        $("#open_time_close").trigger( "click" );
    });

    $('.work-time-check').on('blur', function () {
        if($(this).val().search(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) $(this).val("")
    })

    $('#order-start, #order-end, #campaign-date').datetimepicker({
        locale: 'pt-BR',
        format: 'L',
        defaultDate: moment().format('MM/DD/YYYY'),
    });
    
    let timeIDs = '#campaign-time, #seg-open, #seg-close, #ter-open, #ter-close, #qua-open, #qua-close, ';
    timeIDs += '#qui-open, #qui-close, #sex-open, #sex-close, #sab-open, #sab-close, #dom-open, #dom-close';
    $(timeIDs).datetimepicker({
        locale: 'pt-BR',
        format: 'LT',
        stepping: '5',
    });

    $('#recurrent').on('change', function() {
        $(".schedule_day").toggle();
        $(".schedule_date").toggle();
    });

    $('#headless').on('change', function() {
        const url = `/api/whatsapp/gestor`;
        const inputData = { headless: parseInt($('#headless').val())};
        const data = apiPageData("PUT", url, inputData);

        let stt = !!parseInt($('#headless').val()) ? "Desabilitada" : "Habilitada";

        if(!!data.id) my_alert(`Janela do WhatsApp ${stt} com sucesso!`)
        else my_alert(`Falha ao ${stt} Janela do WhatsApp!`)
    });

    $('#group_reply').on('change', function() {
        const url = `/api/whatsapp/gestor`;
        const inputData = { group_reply: parseInt($('#group_reply').val())};
        const data = apiPageData("PUT", url, inputData);

        let stt = !!parseInt($('#group_reply').val()) ? "Habilitado" : "Desabilitado";

        if(!!data.id) my_alert(`Mensagens em Grupo do WhatsApp ${stt} com sucesso!`)
        else my_alert(`Falha ao ${stt} Mensagens em Grupo do WhatsApp!`)
    });

    $('#blocked_save').on('click', function() {

        let blocked = $('.blocked_save').val();

        blocked = blocked.replace(/[^0-9]/g,'');

        if(!!blocked && blocked.length >= 10) {
            const url = `/api/whatsapp/gestor`;
            const inputData = { blocked_add: blocked };
            const data = apiPageData("PUT", url, inputData);
    
            if(!!data.crud_msg) {
                $('.blocked_save').val('');
                my_alert(data.crud_msg);
            }
            else if(!!data.id) { 
                $('.blocked_save').val('');
                my_alert(`Número ${blocked} bloqueado com sucesso!`);
                appendBlocked((JSON.parse(data.blocked).length - 1), blocked);
            }
            else my_alert(`Falha ao bloquear o número ${blocked}!`)
        }
        else 
        {
            $('.blocked_save').val('');
            my_alert(`Número ${blocked} inválido!`)
        }

    });

    $('#blocked_list').on('click', '.blocked_delete', function() {

        const number = $(this).attr("data-number");

        const url = `/api/whatsapp/gestor`;
        const inputData = { blocked_delete: number };
        const data = apiPageData("PUT", url, inputData);

        if(!!data.crud_msg) {
            my_alert(data.crud_msg);
            $(this).parent().parent().remove();
        }
        else if(!!data.id) { 
            my_alert(`Número ${number} desbloqueado com sucesso!`);
            $(this).parent().parent().remove();
        }
        else {
            my_alert(`Falha ao desbloquear o número ${number}!`);
        }

    });
    
    $('#nomatch_save').on('click', function() {

        const idx = $("#nomatch_idx").val();
        let nomatch = $('.nomatch_save').val().trim();
        nomatch = encodeURIComponent(nomatch);
        $("#nomatch_idx").val('');

        if(!!nomatch) 
        {
            if(!!idx) 
            {
                url = `/api/whatsapp/gestor`;
                inputData = { nomatch_edit_idx: idx, nomatch_edit: nomatch};
                data = apiPageData("PUT", url, inputData);
            }
            else 
            {
                url = `/api/whatsapp/gestor`;
                inputData = { nomatch_add: nomatch };
                data = apiPageData("PUT", url, inputData);
            }

            if(!!data.crud_msg) {
                $('.nomatch_save').val('');
                my_alert(data.crud_msg);
            }
            else if(!!data.id) { 
                $('.nomatch_save').val('');
                reloadMatchList(data);
                my_alert(`Mensagem ${!!idx ? 'atualizada' : 'adicionada'} com sucesso!`);
            }
            else my_alert(`Falha ao ${!!idx ? 'atualizar' : 'adicionar'} mensagem!`)
        }
        else 
        {
            $('.nomatch_save').val('');
            my_alert(`Mensagem inválida!`)
        }
    });

    $('#nomatch_list').on('click', '.nomatch_delete', function() {

        const idx = $(this).attr("data-idx");

        const url = `/api/whatsapp/gestor`;
        const inputData = { nomatch_delete: idx };
        const data = apiPageData("PUT", url, inputData);

        if(!!data.crud_msg) {
            reloadMatchList(data);
            my_alert(data.crud_msg);
        }
        else if(!!data.id) { 
            reloadMatchList(data);
            my_alert(`Mensagem excluída com sucesso!`);
        }
        else {
            my_alert(`Falha ao excluir a mensagem!`);
        }
    });
    
    $('#nomatch_list').on('click', '.nomatch_edit', function() {

        const idx = $(this).attr("data-idx");
        const msg = $(this).attr("data-msg");

        $('#nomatch_idx').val(idx);
        $('.nomatch_save').val(decodeURIComponent(msg));
    });

    $('#autoresponse_list').on('click', '.wmsg-edit', function() {

        const id = $(this).attr("id");

        let contains = $(`#${id}`).parent().attr("data-contain");
        let exact    = $(`#${id}`).parent().attr("data-exact");

        $('.contains_ipt').val(contains);
        $('.exact_ipt').val(exact);
    });

    $('#contains_list').on('click', '.rmcontain', function() {
        const msg = $(this).attr("data-msg");

        let contains = $('.contains_ipt').val();

        try { contains = JSON.parse(contains) } 
        catch(e) { contains = []; }

        let idx = contains.findIndex(el => msg == el);
        if(idx >= 0) contains.splice(idx, 1);

        contains = JSON.stringify(contains);
        $('.contains_ipt').val(contains);

        $(this).parent().parent().parent().parent().remove();
    });

    $('#exact_list').on('click', '.rmexact', function() {
        const msg = $(this).attr("data-msg");

        let exact = $('.exact_ipt').val();

        try { exact = JSON.parse(exact) } 
        catch(e) { exact = []; }
        
        let idx = exact.findIndex(el => msg == el);
        if(idx >= 0) exact.splice(idx, 1);

        exact = JSON.stringify(exact);
        $('.exact_ipt').val(exact);

        $(this).parent().parent().parent().parent().remove();
    });

    $('#contain_save').on('click', function() {
        const msg = $('.contain_save').val();

        let contains = $('.contains_ipt').val().trim();

        if(!contains) contains = [];

        try { contains = JSON.parse(contains) } 
        catch(e) { contains = []; }

        contains.push(msg);
        
        reloadContainList(contains)
        
        contains = JSON.stringify(contains);
        $('.contains_ipt').val(contains);
        $('.contain_save').val('');
    });

    $('#exact_save').on('click', function() {
        const msg = $('.exact_save').val();

        let exact = $('.exact_ipt').val().trim();

        if(!exact) exact = [];

        try { exact = JSON.parse(exact) } 
        catch(e) { exact = []; }

        exact.push(msg);
        
        reloadExactList(exact)
        
        exact = JSON.stringify(exact);
        $('.exact_ipt').val(exact);
        $('.exact_save').val('');
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

            $("#inputNumber").val("");
            $("#inputComplement").val("");
            $("#inputReference").val("");
            
            const url  = `/api/busca-cep/${cep}`;
            const data = apiPageData("GET", url, {});
            
            if(!!data.cep)
            {
                $("#inputAddress").val(data.street);
                $("#inputNeighborhood").val(data.neighborhood);
                $("#inputCity").val(data.city);
                $("#inputState").val(data.state);
            }
            else
            {
                $("#inputAddress").val("");
                $("#inputNeighborhood").val("");
                $("#inputCity").val("");
                $("#inputState").val("");
            }
        }
    });

    $('#restart_wpp').on('click', function() {
        refreshWpp(true);
    });

    $('#qrcode_type').on('change', function() {
        
        if($(this).val() == 'Wi-Fi')
        {
            $('#qrcode_wifi_row').show();
        }
        else 
        {
            $('#qrcode_wifi_row').hide();
            $('#wifi_name').val('');
            $('#wifi_pass').val('');
        }
    });

    $('#qrcode_print').on('click', function() {
        window.print();
    });


    $('#qrcode_submit').on('click', function() {

        $("#qrcode_print").hide();
        $('#qrcode_label').text('');
        $("#qrcode_data").attr("src","");
        
        const qrcode_type = $('#qrcode_type').val() || 'WhatsApp';

        const url  = `/api/qrcode/${qrcode_type}`;
        const type = "POST";
        let inputData = {};

        if(qrcode_type == 'Wi-Fi') {
            inputData = {
                type: $('#wifi_type').val(),
                name: $('#wifi_name').val(),
                pass: $('#wifi_pass').val(),
                hide: ''
            }
        }

        if(qrcode_type == 'Wi-Fi' && (!inputData.name || !inputData.pass)) {
            my_alert('Para gerar o Código QR do Wi-Fi é necessário informar Nome da Rede e Senha')
        }
        else 
        {
            const data = apiPageData(type, url, inputData);
    
            if(data.success.toString() == 'true')
            {
                $('#qrcode_label').text(`Código QR ${qrcode_type}`);
                $("#qrcode_data").attr("src", data.qrcode);
                $("#qrcode_print").show();
            }
        }
        
    });

    $('#business_submit').on('click', function() {

        const inputData  = getInputValue("business-form");
        const inputEmpty = checkInputForm("business-form");
        const validator  = validateBusiness(inputData);

        if(!inputEmpty.length && !validator)
        {
            url    = `/api/business/1`;
            type   = "PUT";
            msg_ok = `Loja atualizada com sucesso!`;
            msg_ng = `Falha ao atualizar Loja, tente novamente e se persistir o erro contate o adminstrador!`;
            
            const data = apiPageData(type, url, inputData);
            
            if(!!data.id)
            {
                const tab_name  = 'business';
                const imageName = !!data.name ? data.name : tab_name;

                saveImage(tab_name, data.id, imageName);

                $('.pass_ipt').val("");
                $('.confirm_pass_ipt').val("");
                my_alert(msg_ok);
            } else {
                my_alert(msg_ng);
            } 
        } else {
            my_alert(validator);
        }
    });

    $(".report_product_view").on('click', function(){
        $(".report_product_view").addClass('btn-outline-danger').removeClass('btn-danger');
        $(this).removeClass('btn-outline-danger').addClass('btn-danger');

        $("#piechart_1_type").val($(this).attr("data-type"));
        drawChartPie();
    });

    $(".report_product_solt").on('click', function(){
        $(".report_product_solt").addClass('btn-outline-danger').removeClass('btn-danger');
        $(this).removeClass('btn-outline-danger').addClass('btn-danger');

        $("#piechart_2_type").val($(this).attr("data-type"));
        drawChartPie();
    });

    $(".report_payment_type").on('click', function(){
        $(".report_payment_type").addClass('btn-outline-danger').removeClass('btn-danger');
        $(this).removeClass('btn-outline-danger').addClass('btn-danger');

        $("#columnchart_1_type").val($(this).attr("data-type"));
        drawChartBar();
    });

    $(".report_payment_origin").on('click', function(){
        $(".report_payment_origin").addClass('btn-outline-danger').removeClass('btn-danger');
        $(this).removeClass('btn-outline-danger').addClass('btn-danger');

        $("#columnchart_2_type").val($(this).attr("data-type"));
        drawChartBar();
    });

    $(".report_delivery_cost").on('click', function(){
        $(".report_delivery_cost").addClass('btn-outline-danger').removeClass('btn-danger');
        $(this).removeClass('btn-outline-danger').addClass('btn-danger');

        $("#columnchart_3_type").val($(this).attr("data-type"));
        drawChartBar();
    });

    $(".report_delivery_qty").on('click', function(){
        $(".report_delivery_qty").addClass('btn-outline-danger').removeClass('btn-danger');
        $(this).removeClass('btn-outline-danger').addClass('btn-danger');

        $("#columnchart_4_type").val($(this).attr("data-type"));
        drawChartBar();
    });

    $("#order_item_list").on('click', '.order_item_delete', function(){
        $(`#order_item_${$(this).attr("data-idx")}`).remove();

        printCart();
    });

    $(".type_ipt").on('change', function(){

        if($(this).val() == 'entregar') 
        {
            $("#order_address").show();
            $('.delivery_ipt').prop("readonly",false);
        } 
        else 
        {
            $("#order_address").hide();
            $(".address_id_ipt").val("");
            $(".delivery_ipt").val("");
            $("#distance_label span").text("0");
            $('.delivery_ipt').prop("readonly",true);
        }
        
        printCart();
    });

    $(".client_id_ipt").on('change', function(){
        const client_id = $(this).find(':selected').val();

        mountClientAdrressOption(client_id);
    });

    $(".address_id_ipt").on('change', function(){
        const cep = $(this).find(':selected').attr('data-zip');

        deliveryDistance(cep);
        
        printCart();
    });

    $("#orders-list").on("click", ".order_sync", function(){
        const order_id    = $(this).attr('data-tabid');
        let employee_id = $(`#order_employee_${order_id}`).find(':selected').val();
        const status      = $(`#order_status_${order_id}`).find(':selected').val();

        console.log(order_id, employee_id, status)

        const url  = `/api/order-admin/${order_id}`;

        if(!status) {
            my_alert("Nenhum status informado para sincronozar o pedido!");
        }
        else 
        {
            if(!employee_id) updObj = {sync: true, status } 
            else updObj = {sync: true, employee_id, status } 
            const data = apiPageData("PUT", url, updObj);

            if(!!data.id) {
                my_alert("Pedido sincronizado com sucesso!");
            } else {
                my_alert(data.msg);
            }
        }
    });

    

    $("#order_item_search").on('change', function(){

        const id   = $(this).find(':selected').attr('data-idx')
        const name = $(this).find(':selected').attr('data-name');
        const val  = $(this).find(':selected').attr('data-val');
        showval = !!parseFloat(val) ? parseFloat(val).toFixed(2).replace('.',',') : val;

        let addPass = true;
        $('.ordem_item').each(function(e) {	    
           
            // Verificação de item duplicado
            if(`order_item_${id}` == $(this).attr('id')) {
                addPass = false;
            }
        });

        if(addPass) {
            $("#order_item_list tbody").prepend(`
                <tr class="ordem_item" id="order_item_${id}" data-tabid="${id}" data-qty="1" data-name="${name}" data-note="" data-val="${val}" >
                    <td class="align-middle">
                        <span data-idx="${id}" title="Excluir Item" class="fas fa-minus-circle text-danger mclick order_item_delete"></span> 
                    </td>
                    <td class="align-middle">
                        <input data-idx="${id}" data-val="${val}" class="form-control form-control-sm order_item_qty" type="number" value="1" min="1" step="1" style="max-width: 60px;">
                    </td>
                    <td class="text-left align-middle">
                        <span id="popover_order_${id}" data-idx="${id}" title="Adicionar Observação ao Item" class="far fa-comment-alt text-primary pt-1 mclick popover_order"></span> 
                        ${name}
                        <small id="order_item_note_${id}" class="form-text text-muted"></small>
                    </td>
                    <td class="text-right align-middle">${showval}</td>
                    <td id="item_val_qty_${id}" class="text-right align-middle">${showval}</td>
                </tr>
            `);
        }

        var popoverContent = `
        <div class="input-group mb-3">
            <input id="obs_add_${id}" type="text" class="form-control" placeholder="Adicione uma observação">
            <div class="input-group-append">
                <button class="btn btn-outline-secondary" type="button" onClick="
                    (function(){
                        $('#order_item_${id}').attr('data-note', $('#obs_add_${id}').val());
                        $('#order_item_note_${id}').text($('#obs_add_${id}').val());
                        $('#popover_order_${id}').popover('hide');
                        printCart();
                        return false;
                    })();return false;
                ">Salvar
                </button>
            </div>
        </div>
        `;

        
        $(`#popover_order_${id}`).popover({
            title: 'Add texto',
            placement: 'top',
            html: true,
            content: popoverContent,
            trigger: 'manual'
        });

        $("#order_item_search").val("");

        printCart();
    });
});



function printCart()
{
    const user_order = [];
    $('#order_item_list tbody .ordem_item').each(function(e) {	
        
        user_order.push({
            "id"   : $(this).attr('data-tabid'), 
            "qty"  : $(this).attr('data-qty'),
            "name" : $(this).attr('data-name'),
            "note" : $(this).attr('data-note'),
            "price": $(this).attr('data-val'),
        });
    });

    tax      = 0;
    delivery = !!parseFloat($('.delivery_ipt').val()) ? parseFloat($('.delivery_ipt').val()) : 0;
    discount = !!parseFloat($('.discount_ipt').val()) ? parseFloat($('.discount_ipt').val()) : 0;
    subtotal = !!user_order.length ? user_order.map(e => parseFloat(e.qty * e.price)).reduce((a,c) => a+c) : 0;
    total    = subtotal + (subtotal * tax) - discount + delivery;
    
    $('#tax_label').text(tax.toFixed(2).replace('.',','));
    $('#delivery_label').text(delivery.toFixed(2).replace('.',','));
    $('#discount_label').text(!!discount ? '-'+discount.toFixed(2).replace('.',',') : '0,00');
    $('#subtotal_label').text(subtotal.toFixed(2).replace('.',','));
    $('#total_label').text(total.toFixed(2).replace('.',','));

    $('.items_ipt').val(JSON.stringify(user_order));
}

function mountClientAdrressOption(client_id) 
{
    let data = apiPageData('GET', `/api/client-address/${client_id}`);
    // const data = apiPageData('GET', `/api/client-address/9`);
    
    mountOrderClientAdresses(data);
}

function mountOrderClientAdresses(data) 
{
    const select = $(`.address_id_ipt`);
    select.empty();
    select.append('<option value="">Selecione um Endereço</option>');

    if(!!data && !!data.length) 
    {
        data = data.filter(el => !!el.zip);
        data.forEach(el => {
            selected = !!el.order_delivery && el.order_delivery == true ? `selected=:"selected"` : '';
            select.append(`<option data-zip="${el.zip}" value="${el.id}" ${selected} >${el.zip} - ${el.street}, ${el.number} - ${el.neighborhood}</option>`);
        });
    }
}

function deliveryDistance(cep)
{
    const url  = `/api/busca-cep/${cep}`;
    const data = apiPageData("GET", url, {});
    
    if(!!data.cep)
    {
        $(".delivery_ipt").val(data.delivery);
        $("#distance_label span").text(data.distance);
    }
}

function checkOpenTime(time_list)
{
    if(!time_list['seg']['open'] || !time_list['seg']['close']) {
        time_list['seg']['open'] = "";
        time_list['seg']['close'] = "";
    }
    if(!time_list['ter']['open'] || !time_list['ter']['close']) {
        time_list['ter']['open'] = "";
        time_list['ter']['close'] = "";
    }
    if(!time_list['qua']['open'] || !time_list['qua']['close']) {
        time_list['qua']['open'] = "";
        time_list['qua']['close'] = "";
    }
    if(!time_list['qui']['open'] || !time_list['qui']['close']) {
        time_list['qui']['open'] = "";
        time_list['qui']['close'] = "";
    }
    if(!time_list['sex']['open'] || !time_list['sex']['close']) {
        time_list['sex']['open'] = "";
        time_list['sex']['close'] = "";
    }
    if(!time_list['sab']['open'] || !time_list['sab']['close']) {
        time_list['sab']['open'] = "";
        time_list['sab']['close'] = "";
    }
    if(!time_list['dom']['open'] || !time_list['dom']['close']) {
        time_list['dom']['open'] = "";
        time_list['dom']['close'] = "";
    }

    showOpenTime(time_list);

    return time_list;
}

function showOpenTime(time_list) 
{
    let label = "";

    if(!!time_list)
    {
        if(!!time_list['seg']['open']) label += `Seg (${time_list['seg']['open']} as ${time_list['seg']['close']}) | `;
        if(!!time_list['ter']['open']) label += `Ter (${time_list['ter']['open']} as ${time_list['ter']['close']}) | `;
        if(!!time_list['qua']['open']) label += `Qua (${time_list['qua']['open']} as ${time_list['qua']['close']}) | `;
        if(!!time_list['qui']['open']) label += `Qui (${time_list['qui']['open']} as ${time_list['qui']['close']}) | `;
        if(!!time_list['sex']['open']) label += `Sex (${time_list['sex']['open']} as ${time_list['sex']['close']}) | `;
        if(!!time_list['sab']['open']) label += `Sáb (${time_list['sab']['open']} as ${time_list['sab']['close']}) | `;
        if(!!time_list['dom']['open']) label += `Dom (${time_list['dom']['open']} as ${time_list['dom']['close']}) | `;
    }

    $(".open_edit").val(label.substr(0, (label.length - 3)));
}

function insertOpenTime(showAlert) 
{
    let time_list;
    
    try {
        time_list = JSON.parse($(".open_ipt").val().trim());
    } catch (error) {
        if(!!showAlert) my_alert("Problemas ao recuperar lista de horários de funcionamento, cadastre novamente para o correto funcionamento!")
    }

    if(!!time_list) {
        $('.work-time-check').each(function(e) {	    
           
            getType    = $(this).attr("data-type");
            getWeekday = $(this).attr("data-weekday");

            $(this).val(time_list[getWeekday][getType]);
        });
    }

    return time_list;
}

function validateBusiness(data) 
{
    let err;

    if(data.name.length < 4) {
        err = "Nome da empresa muito curto";
    } else if(data.mobile.replace(/[^0-9]/g,'').length < 10) {
        err = "Número do WhatsApp inválido. Informe seu número com DDD!";
    } else if(data.mobile.replace(/[^0-9]/g,'').length > 11) {
        err = "Número do WhatsApp inválido. Número informado tem mais que 11 dígitos!";
    } else if(data.user.length < 4) {
        err = "Usuário inválido";
    } else if(!!data.pass.length && data.pass != data.confirm_pass) {
        err = "Confirmação de senha não confere com a senha informada";
    } else if(!!data.pass.length && data.pass.length < 6) {
        err = "Senha muito curta";
    } else if(!data.printer_size.length) {
        err = "Tamanho da fonte da impressão deve ser informada!";
    } else if(data.printer_size < 0) {
        err = "Tamanho da fonte da impressão deve ser maior que ZERO!";
    } else if(!data.tables.length) {
        err = "Quantidade de mesas deve ser informada!";
    } else if(data.tables < 0) {
        err = "Quantidade de mesas inválida";
    } else if(!data.zip.replace(/[^0-9]/g,'').length) {
        err = "CEP deve ser informado!";
    } else if(data.zip.replace(/[^0-9]/g,'').length < 8) {
        err = "CEP informado está incorreto! Todos CEPs devem conter 8 dígitos";
    } else if(!data.street.length) {
        err = "Rua deve ser informada!";
    } else if(!data.number.length) {
        err = "Número deve ser informado!";
    } else if(!data.neighborhood.length) {
        err = "Bairro deve ser informado!";
    } else if(!data.city.length) {
        err = "Cidade deve ser informado!";
    } else if(!data.state.length) {
        err = "Estado deve ser informado!";
    } else if(!data.open.length) {
        err = "Você deve informar o horário de funcionamento!";
    }

    return err;
}

function validateAddress(data) 
{
    let err;

    if(data.zip.replace(/[^0-9]/g,'').length < 8) {
        err = "CEP informado está incorreto! Todos CEPs devem conter 8 dígitos";
    } else if(!data.street.length) {
        err = "Rua deve ser informada!";
    } else if(!data.number.length) {
        err = "Número deve ser informado!";
    } else if(!data.neighborhood.length) {
        err = "Bairro deve ser informado!";
    } else if(!data.city.length) {
        err = "Cidade deve ser informado!";
    } else if(!data.state.length) {
        err = "Estado deve ser informado!";
    }

    return err;
}

function mountCommand(data)
{        
    try {
        items = JSON.parse(data.items);
    }
    catch(err) {
        items = null;
        my_alert("Impressão do Pedido Falhou! Tente novamente e persistindo o erro contate o administrador.");
    }

    let comanda = "";

    // print: {
    //     name: 'Guilherme Portella',
    //     mobile: '11931454848',
    //     street: 'Rua Sebastião dos Santos',
    //     number: '3',
    //     complement: '',
    //     reference: '',
    //     neighborhood: 'Parque Continental I',
    //     city: 'Guarulhos',
    //     state: 'SP'
    // }

    // 40 colunas...
    if(!!items) {
        comanda += `<p>----------------------------------------</p>
        <p>${space(3)}*** COMANDA WHATSAPP / WEBSITE ***${space(3)}</p>
        <p>Data: ${data.date} ${data.time}${space(9)}N.: ${data.label}</p>
        <p>Cliente: ${space(31, data.print.name, 'r')}</p>
        <p>Tel: ${space(35, data.print.mobile, 'r')}</p>`;

        if(!!data.print.street) {

            comanda += `<p>${space(40, data.print.street+', '+data.print.number, 'r')}</p>`;
            comanda += !!data.print.complement.length ? `<p>${space(40, data.print.complement, 'r')}</p>` : '';
            comanda += !!data.print.reference.length ? `<p>${space(40, data.print.reference, 'r')}</p>` : '';
            comanda += `<p>${space(40, data.print.neighborhood, 'r')}</p>
            <p>${space(40, data.print.city+'/'+data.print.state, 'r')}</p>`;
        }

        comanda += `<p>----------------------------------------</p>
        <p>Qtd. Produto${space(21, "Preço")}${space(7, "Valor")}</p>
        <p>----------------------------------------</p>`;

        let = order_subtotal = 0;
        items.forEach(el => {
            order_subtotal += (el.price * el.qty);

            comanda += `<p>${space(3, el.qty)} x ${space(20, el.name, 'r')} ${space(6, el.price.toString().number_format(2,',','.'))} ${space(6, (el.price * el.qty).toString().number_format(2,',','.'))}</p>`;
            comanda += !el.note ? '' : `<p>OBS: ${space(35, el.note, 'r')}</p>`;
        });

        const order_tax   = data.tax == 1 ? (order_subtotal * 0.10) : 0;
        const order_total = order_subtotal + data.delivery + order_tax + data.discount;
        
        comanda += `<p>----------------------------------------</p>
        <p>${space(29, "Consumo:")}${space(11, order_subtotal.toString().number_format(2,',','.'))}</p>
        <p>${space(29, "Serviço:")}${space(11, order_tax.toString().number_format(2,',','.'))}</p>
        <p>${space(29, "Entrega:")}${space(11, data.delivery.toString().number_format(2,',','.'))}</p>
        <p>${space(29, "Desconto:")}${space(11, data.discount.toString().number_format(2,',','.'))}</p>
        <p>----------------------------------------</p>
        <p>${space(29, "Total:")}${space(11, order_total.toString().number_format(2,',','.'))}</p>
        <p>----------------------------------------</p>`;
        
        comanda += !!data.payment_obs ? `<p>${space(40, "Troco p/ "+data.payment_obs)}</p>` : '';
        comanda += `<p>----------------------------------------</p>`;
    }

    return comanda;
}

function printCommand(tab_id) 
{
    const url     = `/api/order/${tab_id}`;
    const data    = apiPageData("GET", url, {});
    const comanda = mountCommand(data);

    if(!!comanda) 
    {
        // display: block;
        $('#comanda').css("font-size", `${$('#comanda').attr('data-font-size') || 2}rem`);
        $("#comanda").html(comanda);
        $("#print_audio").get(0).play();
        window.print();
        $("#comanda").html("");
    }
    else {
        console.log("Falha ao imprimir comanda")
    }
}

function addInputAddress(data) 
{
    $('#dataClientId').val(data.client_id);
    $("#inputAdresses").val(data.id);
    $("#inputZip").val(data.zip);
    $("#inputAddress").val(data.street);
    $("#inputNumber").val(data.number);
    $("#inputComplement").val(data.complement);
    $("#inputReference").val(data.reference);
    $("#inputNeighborhood").val(data.neighborhood);
    $("#inputCity").val(data.city);
    $("#inputState").val(data.state);
}

function cleanInputAddress() 
{
    $('#dataClientId').val("");
    $("#inputAdresses").val("");
    $("#inputZip").val("");
    $("#inputAddress").val("");
    $("#inputNumber").val("");
    $("#inputComplement").val("");
    $("#inputReference").val("");
    $("#inputNeighborhood").val("");
    $("#inputCity").val("");
    $("#inputState").val("");
}

function refreshWpp(restart)
{
    const data = apiPageData('POST', '/api/whatsapp-restart', { restart });
    
    if(!!data.result && data.result == 'success') {
        if(!!$("#print_whatsapp_msg")) {
            $("#print_whatsapp_msg").val("Reiniciado com sucesso!\nAguarde o QR Code para iniciar seu WhatsApp");
        }
    } else {
        if(!!$("#print_whatsapp_msg")) {
            $("#print_whatsapp_msg").val("Falha ao reiniciar o WhatsApp!");
        }
    }
}




// SOCKET.IO
// const socket = io(); 
// // const socket_externo = io.connect("http://localhost:8080");
// socket.on('connect', function(){
//     $('#msg').append('Connected with id: '+socket.id+'<br>');
//     socket.emit('msg', 'I am connected '+socket.id)
// })
// socket.on('msg', function(msg){
//     $('#msg').append(msg+'<br>');
// }) 


const socket = io();

// Recebe comanda
socket.on('print_command', function(tab_id){
    printCommand(tab_id);
});

socket.on('print_whatsapp_msg', function(msg){

    let whatsappMsg = $('#print_whatsapp_msg').val();

    if(!!whatsappMsg)
    {
        // Limita a qtd de mensagens para exibição no textarea
        if(whatsappMsg.split('\n').length > 50) {
            whatsappMsg = whatsappMsg.split('\n').slice(-1).join('\n');
        }
        
        $('#print_whatsapp_msg').val(`${msg}\n${whatsappMsg}`);
    }

})

socket.on('print_whatsapp_qrcode', function(msg) 
{
    if(msg == 'start' || msg == 'success') {
        $('#print_whatsapp_qrcode').hide();
        $('#print_whatsapp_qrcode img').hide();
    }
    else
    {
        $('#print_whatsapp_qrcode').show();
        $('#print_whatsapp_qrcode').html(`<img src="${msg}" alt="Escanei-me para Iniciar" width="350" height="350" />`);
    }
})

$(function(){
    $("input").keydown(function(key){
        if(key.keyCode == 13)
        {
            socket.emit('msg', $(this).val())
            $(this).val('');
        }
    })
});






// Funções Locais
const defaultDataTable = {
    language: {
        processing:     "Processando...",
        search:         "Buscar:",
        lengthMenu:     "Exibir _MENU_ registros",
        info:           "_START_ ao _END_ de _TOTAL_ registros",
        infoEmpty:      "0 registros",
        infoFiltered:   "(Filtrados de _MAX_ registros)",
        loadingRecords: "Buscando registros...",
        zeroRecords:    "Nenhum registro encontrado",
        emptyTable:     "Nenhum registro encontrado",
        decimal:        ",",
        thousands:      ".",
        paginate: {
            first:      "Primeiro",
            previous:   "Anterior",
            next:       "Proximo",
            last:       "Ultimo"
        }
    },
    order: [[ 0, "asc" ]],
    iDisplayLength: 5, // Default No of Records per page on 1st load
    aLengthMenu: [5, 10, 25, 50, 100, 500, 1000], // Set no of records in per page
};

function space(qty, str, pad)
{
    if(!str) str = "";
    str = str.toString();

    if(str.length > qty) str = str.substr(0, qty);
    str = str.trim();
    
    if(!pad) return str.padStart(qty, "\xa0");
    else return str.padEnd(qty, "\xa0");
}

function appendBlocked(idx, number) {

    $("#blocked_list tbody").append(`
        <tr>
            <td style="width: 85%;">${number.length == 11 ? mask(number, "(##) #####-####") : (number.length == 10 ? mask(number, "(##) ####-####") : number )}</td>
            <td>
                <span data-number="${number}" class="fas fa-minus-square text-danger mclick blocked_delete"></span>
            </td>
        </tr>
    `);
}

function reloadMatchList(data) {

    let nomatchs = JSON.parse(data.no_match);
    nomatchs = !!nomatchs && !!nomatchs.length ? nomatchs : [];

    if(!!nomatchs.length) $('#nomatch_list tbody').empty();

    nomatchs.forEach((el, idx) => {
        $("#nomatch_list tbody").append(`
            <tr>
                <td style="width: 85%;">${el}</td>
                <td>
                    <span data-idx="${idx}" data-msg="${encodeURIComponent(el)}" class="fas fa-pen-square text-primary mclick nomatch_edit"></span>
                    <span data-idx="${idx}" data-msg="${encodeURIComponent(el)}" class="fas fa-minus-square text-danger mclick nomatch_delete"></span>
                </td>
            </tr>
        `);
    });
}

function mask(val, mask){
        
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

function setDataTable(id)
{
    const type = $(id).attr('data-option');
    
    // Adiciona particularidades de cada DataTable
    if(type == 'order') 
    {
        // defaultDataTable.order = [[ 2, "desc" ], [ 3, "desc" ]];
        defaultDataTable.order = [ 0, "desc" ];
        defaultDataTable.columnDefs = [
            {
                render: function ( data, type, row ) { return data.toString().number_format(2,',','.') },
                targets: [3]
            }
        ];
        defaultDataTable.drawCallback = function () {
            const api = this.api();
            
            const order_all  = api.column(3).data().sum();
            const order_view = api.column(3, {page:'current'}).data().sum();

            // const delivery_all  = api.column(6).data().sum();
            // const delivery_view = api.column(6, {page:'current'}).data().sum();

            $("#order-total").html(order_all.toString().number_format(2,',','.'));
            $("#order-subtotal").html(order_view.toString().number_format(2,',','.'));

            // $("#delivery-total").html(delivery_all.toString().number_format(2,',','.'));
            // $("#delivery-subtotal").html(delivery_view.toString().number_format(2,',','.'));
            
            if(order_all == 0)
            {
                $("#total-order").hide();
                $("#subtotal-order").hide();
            }
            else if(order_all == order_view)
            {
                $("#total-order").show();
                $("#subtotal-order").hide();
            }
            else
            {
                $("#total-order").show();
                $("#subtotal-order").show();
            }
        }
    
        $('#order-start, #order-end').on("change.datetimepicker", ({date, oldDate}) => {
            formTable.draw();
        });

        jQuery.fn.dataTableExt.afnFiltering.push(
            function( oSettings, aData, iDataIndex ) {
                let iFini = document.getElementById('date-min').value;
                let iFfin = document.getElementById('date-max').value;
                let iStartDateCol = 1;
                let iEndDateCol   = 1;
        
                iFini=iFini.substring(6,10) + iFini.substring(3,5)+ iFini.substring(0,2);
                iFfin=iFfin.substring(6,10) + iFfin.substring(3,5)+ iFfin.substring(0,2);
                
                const datofini = aData[iStartDateCol].substring(6,10) + aData[iStartDateCol].substring(3,5)+ aData[iStartDateCol].substring(0,2);
                const datoffin = aData[iEndDateCol].substring(6,10) + aData[iEndDateCol].substring(3,5)+ aData[iEndDateCol].substring(0,2);
                
                if ( iFini === "" && iFfin === "" ) return true;
                else if ( iFini <= datofini && iFfin === "") return true;
                else if ( iFfin >= datoffin && iFini === "") return true;
                else if (iFini <= datofini && iFfin >= datoffin) return true;
        
                return false;
            }
        );
    }
    else if(type == 'client-list')
    {
        defaultDataTable.bInfo = false;
        defaultDataTable.paging = false;
        defaultDataTable.bPaginate = false;
        defaultDataTable.fixedHeader = true;
        // defaultDataTable.columnDefs = [{
        //     targets: 0,
        //     orderable: false
        // }]
    }
    else if(type == 'message')
    {
        defaultDataTable.searching = false;
        defaultDataTable.lengthChange = false;
        defaultDataTable.iDisplayLength = 2;
    }
    
    const formTable = $(id).DataTable(defaultDataTable);
}

function apiPageData(type, url, data)
{
    let result = '';

    $.ajax
    ({
        type: type,
        url: url,
        dataType: 'json',
        async: false,
        data: data,
        success: function (rtn) { result = rtn; }
    });

    return result;
}

function modalData(modal, data)
{
    $.each(data, function( index, value ) {
        if(index == 'status') modal.find('.'+index+'_modal').text(value.ucwords());
        else modal.find('.'+index+'_modal').text(value);
    });
}

function cleanInputForm(form_id, type)
{
    if(type)
    {
        $('#'+form_id+' .id_ipt').val('');
        $('#'+form_id+' .form_action_ipt').val('');
    }

    $('#'+form_id+' .form-control').each(function(e)
    {	    
        $(this).removeClass('is-invalid');
        $('.'+$(this).data('name')+'-err').hide();
    });

    $('#'+form_id).trigger('reset');

    // Somente para ORDER 
    orderAddtionalClean();
}

function inputData(modal, data, act, table)
{
    modal.find('.form_action_ipt').val(act);

    $.each(data, function( index, value ) {

        if(table == 'order' && index == 'adresses') {
            mountOrderClientAdresses(value);
            console.log(value)
        }

        modal.find('.'+index+'_ipt').val(value);
    });
}

function getInputValue(form_id)
{
    let array_data = [];
    
    $("#"+form_id+" .form-control").each(function(event){	
        $(this).removeClass('is-invalid');
        $('.'+$(this).data('name')+'-err').hide();
        if(!!$(this).data('name')) array_data[$(this).data('name')] = this.value;
    });

    delete array_data.id;
    delete array_data.form_action;

    return Object.assign({}, array_data);
}

function checkInputForm(form_id)
{
    const inputEmpty = [];

    $("#"+form_id+" .form-control").each(function(e)
    {	    
        if($(this).data('required') == true && this.value.trim() == "")
        {
            inputEmpty.push($(this).data('name'));
            $(this).addClass('is-invalid');
            $('.'+$(this).data('name')+'-err').show();
        }
    });

    return inputEmpty;
}

function orderAddtionalClean()
{
    $('.client_id_ipt').val("");
    $('.employee_id_ipt').val("");
    $('.address_id_ipt').val("");
    $('.selectpicker').selectpicker('refresh'); // Para atualizar selectpicker
    $('#order_item_search').val("");
    $('#order_item_list tbody').empty();
    printCart();
}

function getBelongsTo(relations, rel_col)
{
    relations = relations.split(',');
    
    $.each(relations, function( index, table ) {
        data = apiPageData("GET", `/api/${table}`, {});

        setBelongsTo(data, rel_col);
    });
}

function setBelongsTo(data, rel_col)
{
    const select = $(`.${rel_col}_ipt`);

    select.empty();

    $.each(data, function( index, attr ) {
        select.append($('<option>', {
            value: attr.id,
            text: attr.name
        }));
    });
}

function saveImage(table, id, name)
{
    let image = document.getElementById("image-upload");

    if(!!image && !!image.files && !!image.files[0])
    {
        image = image.files[0];

        const xhr = new XMLHttpRequest();
        const formData = new FormData();
    
        formData.append("image", image);                                
        
        xhr.open("POST", `/api/image/${table}/${id}/${tag_name(name)}`);
        xhr.overrideMimeType("multipart/form-data");
        xhr.send(formData);
    }
}

function otherOptionsAll(tab_name)
{
    if(tab_name == 'mailing') optionAllMailing();
    else if(tab_name == 'message') optionAllMessage();
}

function otherOptionsUpdate(tab_name)
{
    if(tab_name == 'mailing') optionUpdateMailing();
    else if(tab_name == 'campaign') optionUpdateCampaign();
    else if(tab_name == 'order') optionUpdateOrder();
}

function optionUpdateCampaign() 
{
    recurrenceCheck();
    datetimeFix();

    $('.status_ipt').val('free');
}

function optionUpdateOrder() 
{
    $('.selectpicker').selectpicker('refresh');

    // Preencher items 
    try {
        const items = JSON.parse($(".items_ipt").val());
        if(!!items) {
            items.forEach(el => {
                $("#order_item_search").selectpicker('val', el.id); 
                $("#order_item_search").trigger('change');

                $(`#order_item_${el.id}`).attr("data-note", el.note);
                $(`#order_item_note_${el.id}`).text(el.note);
            }); 
        } 
    } catch (error) { 
        console.log("Erro ao decodificar os items do pedido! Erro: "+error)
    } 

    if($('.type_ipt').val() == 'entregar') {
        $(".type_ipt").trigger('change');
    }
}

function optionUpdateMailing() 
{
    syncInputClientList();
}

function optionAllMailing()
{
    cleanClientList();
}

function reloadContainList(contains) 
{
    if(!!contains.length) $('#contains_list tbody').empty();

    contains.forEach(el => {
        $("#contains_list tbody").append(`
            <tr>
                <td colspan="2" >
                    <div class="row">
                        <div class="col-sm-10">${el}</div>
                        <div class="col-sm-2 text-center">
                            <i class="btn btn-sm fas fa-minus-square text-danger mclick rmcontain" data-msg="${el}"></i>
                        </div>
                    </div>
                </td>
            </tr>
        `);
    });
}

function reloadExactList(exact) 
{
    if(!!exact.length) $('#exact_list tbody').empty();

    exact.forEach(el => {
        $("#exact_list tbody").append(`
            <tr>
                <td colspan="2" >
                    <div class="row">
                        <div class="col-sm-10">${el}</div>
                        <div class="col-sm-2 text-center">
                            <i class="btn btn-sm fas fa-minus-square text-danger mclick rmexact" data-msg="${el}"></i>
                        </div>
                    </div>
                </td>
            </tr>
        `);
    });
}

function optionAllMessage() 
{
    let contains = $('.contains_ipt').val();
    let exact    = $('.exact_ipt').val();
    
    contains = !!contains ? JSON.parse(contains) : false;
    contains = !!contains && !!contains.length ? contains : [];

    reloadContainList(contains);
    
    exact = !!exact ? JSON.parse(exact) : false;
    exact = !!exact && !!exact.length ? exact : [];

    reloadExactList(exact);
}

function cleanClientList()
{
    $( ".checked-all" ).prop( "checked", false);
}

function syncInputClientList()
{
    const client_list = !!$('#client_list').val() ? JSON.parse($('#client_list').val()) : "";

    $('.checked-all').prop('checked', false);
    $('.checked-all').each(function() {	 
        if(client_list.indexOf(parseInt($(this).attr('data-clid'))) != -1) $(this).prop('checked', true);
    });
    
    if($('#type_list').val() == "all") $('#table-client-list').hide();
    else $('#table-client-list').show();
    
    $('.client_list_opt').each(function() {	    
        if($(this).val() == $('#type_list').val()) $(this).prop('checked', true);
        else $(this).prop('checked', false)
    });
}

function recurrenceCheck()
{
    if($('#recurrent').val() == 1) 
    {
        $(".schedule_day").show();
        $(".schedule_date").hide();
    }
    else 
    {
        $(".schedule_day").hide();
        $(".schedule_date").show();
    }
}

function datetimeFix()
{
    let date = $('#camp-date').val();
    date = !!date ? date.split('T') : '';
    date = !!date.length ? date[0].split('-') : '';
    date = !!date.length ? `${date[2]}/${date[1]}/${date[0]}` : '';

    let time = $('#camp-time').val();
    time = !!time ? time.split(':') : '';
    time = !!time.length ? `${time[0]}:${time[1]}` : '';

    if(!!date) $('#camp-date').val(date);
    if(!!time) $('#camp-time').val(time);
}

function getParams(url) {
	var params = {};
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};












// Funcões Globais
String.prototype.ucwords = function () {
    let str = this.toLowerCase()
    let re = /(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g
    return str.replace(re, s => s.toUpperCase())
};

function tag_name(filename) {
    filename = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    filename = filename.replace(/[^A-Za-z0-9-]/gi,' ');
    filename = filename.split(' ').join('-');
    filename = filename.toLowerCase();
    return filename;
}

String.prototype.str_pad = function (pad_length, pad_string, pad_type, prefix) {
    
    input = this.toString();

    if (! input || ! pad_string || input.length >= pad_length) return input;
    
    let max = (pad_length - input.length)/pad_string.length;
    
    for (let i=0; i<max; i++)
    {
        if(pad_type == "right") input += pad_string;
        else input = pad_string + input;
    }
    
    return prefix+input;
}

String.prototype.number_format = function (decimals, dec_point, thousands_sep)  {
    number = this.toString().replace(/[^0-9+\-Ee.]/g, '');
    
    let n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
    
    toFixedFix = function(n, prec) {
        let k = Math.pow(10, prec);
        return '' + (Math.round(n * k) / k).toFixed(prec);
    };
    
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');

    if (s[0].length > 3) {
      s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '')
      .length < prec) {
      s[1] = s[1] || '';
      s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}

jQuery.fn.dataTable.Api.register( 'sum()', function ( ) {
	return this.flatten().reduce( function ( a, b ) {
		if ( typeof a === 'string' ) {
			a = a.replace(/[^\d.-]/g, '') * 1;
		}
		if ( typeof b === 'string' ) {
			b = b.replace(/[^\d.-]/g, '') * 1;
		}

		return a + b;
	}, 0 );
});

