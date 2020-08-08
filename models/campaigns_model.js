const db = require('../config/db');

const sql1 = `
    SELECT ca.id, ca.schedule_time, ca.message, ca.image, 
        ma.type, ma.client_list
    FROM campaign ca 
    JOIN mailing ma ON (ca.mailing_id = ma.id)
    WHERE (ca.schedule_date = DATE(NOW()) OR ca.schedule_day = WEEKDAY(NOW()))
    AND (ca.status = "free" OR (ca.status = "sent" AND ca.sent_date IS NOT NULL AND DATE(ca.sent_date) != DATE(NOW())))
    AND ca.active = 1
`;

const getCampaigns       = ()           => db('campaign');
const getCampaign        = (id)         => db('campaign').where({id}).first();
const getCampaignMailing = ()           => db.raw(sql1);
const insertCampaign     = (data)       => db('campaign').insert(data);
const updateCampaign     = (id, data)   => db('campaign').where({id}).update(data);
const deleteCampaign     = (id)         => db('campaign').where({id}).delete();
const hasManyCampaign    = (mailing_id) => db('campaign').where(mailing_id).count('* AS campaign_qty').first();

module.exports = { getCampaigns, getCampaign, getCampaignMailing, insertCampaign, updateCampaign, deleteCampaign, hasManyCampaign }
