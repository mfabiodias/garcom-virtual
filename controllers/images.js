const helper = require('../helpers');
const model  = require('../models');
const formidable = require('formidable');
const fs = require('fs');

function saveImage(res, req)  
{ 
    const tab_id    = req.params.id;
    const tab_name  = req.params.table;
    const tab_image = req.params.name;

    const tab_avaliable = ['business','campaign','category','product','message']

    if(tab_avaliable.includes(tab_name)) 
    {            
        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            let ext = files.image.name.split('.');
            ext = ext[ext.length-1];
            
            const client  = !!process.env.CLIENT ? "/"+process.env.CLIENT : "";
            const image   = helper.tag_name(tab_image+'-'+tab_id)+'.'+ext;
            const newpath = process.cwd()+'/public/image/'+tab_name+client+'/'+image;
            const oldpath = files.image.path;
            fs.rename(oldpath, newpath, async function (err) {
                if (err) throw err;
    
                const data = { image };
                
                if(tab_name == 'business') await model.updateBusiness(data);
                else if(tab_name == 'campaign') await model.updateCampaign(tab_id, data);
                else if(tab_name == 'category') await model.updateCategory(tab_id, data);
                else if(tab_name == 'product') await model.updateProduct(tab_id, data);
                else if(tab_name == 'message') await model.updateMessage(tab_id, data);
    
                res.write('File uploaded and moved!');
                res.end();
            });
        });
    }
}

module.exports = { saveImage }