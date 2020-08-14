const dateFormat = require('dateformat');
const config = require('../config/config');
const fs = require("fs"); 
const { array } = require('yargs');

const ExportFunction = {
    isEmpty: (str) => (!str || 0 === str.length),
    number_only: (str) => str.replace(/[^0-9]/g,''),
    renameKey: (obj, key, newKey) => {
        const clonedObj = obj;
        const targetKey = clonedObj[key];
    
        delete clonedObj[key];
        clonedObj[newKey] = targetKey;
    
        return clonedObj;
    },
    objectEmpty: (str) => {
        return Object.entries(str).reduce((a,[k,v]) => (v ? (a[k]=v, a) : a), {})
    },
    ucwords: (str) => {
        str = !str ? "" : str;
        str = str.toLowerCase()
        let re = /(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g
        return str.replace(re, s => s.toUpperCase())
    },
    number_format: (number, decimals, dec_point, thousands_sep) => {
        number = number.toString().replace(/[^0-9+\-Ee.]/g, '');
        
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
    },
    relationshipBelongsto: (belongsTo, hasMany, relShipIn) => {
        return belongsTo.map(function(str) {
            str[relShipIn] = hasMany.find(x => x.id == str[relShipIn+"_id"]);
            return str;
        });
    },

    // produto categoria 
    relationshipHasMany: (belongsTo, hasMany, relShipIn) => {
        return hasMany.map(function(obj) {
            obj[relShipIn] = belongsTo.filter(x => x.category_id == obj.id);
            return obj;
        });
    },
    orderTotal: (orders, products, employees) => {
        return orders.map((order) => {    
            order.opt = { 
                amount: {
                    total_qty: 0,
                    total_price: parseFloat(order.delivery) + parseFloat(order.discount)
                },
                items:0,
                data:[]
            }; 
            
            // Exibe funcionário responsável pela entrega 
            let employee = employees.find(x => x.id == order.employee_id);
            order.employee = !!employee ? employee.name : "";

            let order_items = JSON.parse(order.items);

            order_items.map((item) => {
                let order_item = {
                    id: item.id,
                    product: item.name,
                    item: item.name,
                    price: parseFloat(item.price),
                    qty: parseInt(item.qty),
                    note: !!item.note ? item.note : ''
                };

                order.opt.items += 1;
                order.opt.amount.total_qty += parseFloat(item.qty);
                order.opt.amount.total_price += parseFloat(item.price) * parseFloat(item.qty);

                order.opt.data.push(order_item);
            });

            order.opt.amount.total_price = order.opt.amount.total_price.toFixed(2);

            return order;
        });
    },
    stringLimit: (str, limit) => {
        if(str.length > limit) return str.substring(0, limit)+"...";
        else return str;
    },
    str_pad: (input, pad_length, pad_string, pad_type, prefix) => {
    
        input = input.toString();

        if (! input || ! pad_string || input.length >= pad_length) return input;
        
        let max = (pad_length - input.length)/pad_string.length;
        
        for (let i=0; i<max; i++)
        {
            if(pad_type == "right") input += pad_string;
            else input = pad_string + input;
        }
        
        return prefix+input;
    },
    mime_type: (mime) => {
        // image/gif, image/png, image/jpeg, image/bmp, image/webp
        if(mime == '.jpg' || mime == '.jpeg') return 'image/jpeg';
        else if(mime == '.png') return 'image/png';
        else return false;
    },
    date: (date, format) => dateFormat(date, format),
    addDays: (date, days) => {
        let result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },
    tag_name: (filename) => {
        filename = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        filename = filename.replace(/[^A-Za-z0-9-]/gi,' ');
        filename = filename.split(' ').join('-');
        filename = filename.toLowerCase();
        return filename;
    },
    image_show: (table, file, type, height, width, myid, myclass, mytitle, myalt) => {
        let url; 
        const client = !!process.env.CLIENT ? "/"+process.env.CLIENT : "";
        
        if(!!file && fs.existsSync(`${process.cwd()}/public/image/${table}${client}/${file}`)) {
            url = `/image/${table}${client}/${file}`;
        }
        else { 
            if(table == 'campaign') url = `/image/no-campaign.png`;
            else url = `/image/no-image.png`;
        }
        
        if(!!type) return url;
         
        return  `<img id="${myid}" src="${url}" width="${!!height ? height : 30}" height="${!!width ? width : 30}" class="${myclass}" alt="${myalt}" title="${mytitle}" />` ;
    },
    mask: (val, mask) => {
        
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
    },
    mailingQty: (mailing) => {

        if(mailing.type == 'all') return "Todos";
        else {
            mailing = JSON.parse(mailing.client_list);

            if(!!mailing.length) return mailing.length;
            else return 0;
        }
    },
    weekDayLabel: (day) => {
        if(day == 0) return 'Segunda-Feira';
        else if(day == 1) return 'Terça-Feira';
        else if(day == 2) return 'Quarta-Feira';
        else if(day == 3) return 'Quinta-Feira';
        else if(day == 4) return 'Sexta-Feira';
        else if(day == 5) return 'Sábado';
        else if(day == 6) return 'Domingo';
        else return day;
    },
    weekDayCheck: (day) => {
        if(day >= 0 && day <= 6) return true;
        else return false;
    },
    bdDateCheck: (date) => {
        date = date.split('/');
        if(date.length != 3) return false;
        else if(date[0].length != 2) return false;
        else if(date[1].length != 2) return false;
        else if(date[2].length != 4) return false;
        else return `${date[2]}-${date[1]}-${date[0]}`;
    },
    messagesCount: (obj) => {
        obj = JSON.parse(obj);

        if(!!obj && !!obj[0]) return `${obj.length} Frase(s)`;
        else return '';
    },
    messageBlocked: (str) => {
        
        if(!str) return [];
        
        let arr;
        try { arr = JSON.parse(str); } 
        catch (e) { arr = []; }

        return arr;
    },
    messageNoMatch: (el) => {
        el = !!el ? JSON.parse(el) : [];
        return `{${el.join("|")}}`
    }, 
    messageResponse: (arr) => {

        // let icones1 = ["🤔","👍"]; 
        // let icones2 = encodeURIComponent(JSON.stringify(icones1));
        // let icones3 = JSON.parse(decodeURIComponent(icones2)); 

        // msg.push({
        //     contains: !!row.contains ? JSON.parse(row.contains) : [],
        //     exact:    !!row.exact ? JSON.parse(row.exact) : [],
        //     response: !!row.response ? decodeURIComponent(row.response) : "",
        //     file:     !!row.image ? `/public/image/message${client}/${row.image}` : "",
        // })

        const client = !!process.env.CLIENT ? "/"+process.env.CLIENT : "";

        const msg = [];
        arr.forEach(row => {
            msg.push({
                contains: !!row.contains ? JSON.parse(row.contains)  : [],
                exact:    !!row.exact ? JSON.parse(row.exact) : [],
                response: !!row.response ? row.response : "",
                file:     !!row.image ? `/public/image/message${client}/${row.image}` : "",
            });
        });

        return msg;
    },
    messageCampaign: (lista) => {
        let campMessage = [];
        let count = 0;
        lista.forEach(el => {

            campMessage.push({
                id: el.id,
                date: el.schedule_time,
                message:    el.message,
                image:      el.image,
                image_data: el.image_data,
                user: []
            });
    
            el.clients.forEach(cli => {
                campMessage[count].user.push({
                    name:       cli.name,
                    wppid:      cli.whatsapp_user,
                    // message:    el.message,
                    // image:      el.image,
                    // image_data: el.image_data
                })
            });
            
            count++;
        });

        return campMessage;
    },
    limitedEllipsis: (str, size) => {
        if(str.length >= size) return str.substring(0, size) + " ...";

        return str;
    }, 
    strrev: (str) => {
        let splitString = str.split(""); 
        let reverseArray = splitString.reverse();
        let joinArray = reverseArray.join("");
        return joinArray;
    },
    str_rot13: (str) => {
        return (str + '').replace(/[a-z]/gi, function (s) {
            return String.fromCharCode(s.charCodeAt(0) + (s.toLowerCase() < 'n' ? 13 : -13));
        });
    },
    base64_encode: (data) => {
        let buff = Buffer.from(data);
        return buff.toString('base64');
    },
    base64_decode: (data) => {
        let buff = Buffer.from(data, 'base64');
        return buff.toString('ascii');
    },
    my_encrypt: (str) => {	
        str = ExportFunction.base64_encode(ExportFunction.str_rot13(ExportFunction.strrev(str)));
        
        size = str.length;
        if(size%2) point = Math.floor(size/2);
        else point = size/2;

        str = str.substr(0, point) + ExportFunction.str_rot13(ExportFunction.strrev(str.substr(point, size)));

        return str.replace("=", "+");
    },
    my_decrypt: (str) => {
        str = str.replace("+", "=");

        size = str.length;
        if(size%2) point = Math.floor(size/2);
        else point = size/2;

        str = str.substr(0, point) + ExportFunction.str_rot13(ExportFunction.strrev(str.substr(point, size)));
        
        return ExportFunction.str_rot13(ExportFunction.strrev((ExportFunction.base64_decode(str))));
    },
    user_hash_encrypt: (tel) => {
        const date1 = dateFormat(new Date, 'dyy');
        const date2 = dateFormat(new Date, 'md');

        return ExportFunction.my_encrypt(`${date1}-${tel}-${date2}`)
    },
    user_hash_decrypt: (hash) => {
        return (ExportFunction.my_decrypt(`${hash}`)).split('-')[1];
    },
    order_status: (id) => {
        if(id == 0) return "Cancelada";
        else if(id == 1) return "Aprovada";
        else if(id == 2) return "Em preparo";
        else if(id == 3) return "Saiu para entrega";
        else if(id == 4) return "Entregue";
        else if(id == 5) return "Devolvida";
        else return "Desconhecido";
    },
    order_total_cost: (order) => {
        items = JSON.parse(order.items);
        items = !!items && !!items.length ? items : [];
        
        let cost = parseFloat(order.delivery) + parseFloat(order.discount);
        items.forEach(el => {
            cost += parseFloat(el.qty) * parseFloat(el.price);
        });

        return !!cost ? ExportFunction.number_format(cost, 2, ',', '.') : cost;
    },
    bdWeekLabel: (week) => {
        // 0 = Monday, 1 = Tuesday, 2 = Wednesday, 3 = Thursday, 4 = Friday, 5 = Saturday, 6 = Sunday
        // MySQL function WEEKDAY(NOW())
       
        if(week == 0) return 'seg';
        else if(week == 1) return 'ter'
        else if(week == 2) return 'qua'
        else if(week == 3) return 'qui'
        else if(week == 4) return 'sex'
        else if(week == 5) return 'sab'
        else if(week == 6) return 'dom'
        else return false;
    },
    business_open: (json, week) => {
        
        let obj;
        try {
            obj =  JSON.parse(json)
        } catch (e) {
            console.log("Falha ao converter JSON do horário de funcionamento!");
        }

        const weekLabel = ExportFunction.bdWeekLabel(week)
        if(!!obj && !!weekLabel && !!obj[weekLabel] && !!obj[weekLabel]['open'] && !!obj[weekLabel]['close']) 
        {
            const timeNow   = dateFormat(new Date(), 'HH:MM');
            const timeStart = dateFormat(`2020-01-01 ${obj[weekLabel]['open']}`, 'HH:MM');
            const timeEnd   = dateFormat(`2020-01-01 ${obj[weekLabel]['close']}`, 'HH:MM');

            if(timeNow >= timeStart && timeNow <= timeEnd) return true; 
            else return `Já fechamos 😔! ${ExportFunction.ucwords(weekLabel)}. é das ${obj[weekLabel]['open']} as ${obj[weekLabel]['close']}`;
        }
        else {
            return `${ExportFunction.ucwords(weekLabel)}. estamos fechados 😔!`;
        }
    }
}

module.exports = ExportFunction;