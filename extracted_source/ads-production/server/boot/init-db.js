module.exports = function InitDB(app) {
    const { Configuration, CampaignCached } = app.models;
    Configuration.findOne({where: {key: 'maxFileSize'}}, (err, config)=>{
        if(!config){
            Configuration.create({key: 'maxFileSize', value: 10});
            Configuration.create({key: 'cloudSourcePath', value: '/resource'});
            Configuration.create({key: 'cloudDir', value: '/data/wifi4u/data/cloudcmd'});
        }
    });
};
