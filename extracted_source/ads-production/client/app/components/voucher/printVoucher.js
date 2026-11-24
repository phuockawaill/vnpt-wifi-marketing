import moment from 'moment';
import __ from 'lodash';

const PrintThermal = (data) => {
    let popupWin = window.open('', '_blank');
    let tables = '', quotaString;
    data.forEach((item)=>{
        tables += '<table style="width: 100%; border: none;">';
        tables += '<tr><td class="title">Voucher</td><td class="content" style="font-weight: bold">'+item.code+'</td></tr>';
        if(item.expiredAt){
            tables += '<tr><td class="title">Expiration at</td><td class="content">'+moment(item.expiredAt).format('MMM DD YYYY HH:mm')+'</td></tr>';
        } else {
            tables += '<tr><td class="title">Expiration after login</td><td class="content">'+moment(moment().valueOf()+item.expireTime).fromNow(true)+'</td></tr>';
        }
        if(item.quota){
            if(item.quota>1){
                quotaString = 'Multi device ('+item.quota+')';
            } else {
                quotaString = 'Single device';
            }
        } else {
            quotaString = 'Unlimited';
        }
        tables += '<tr><td class="title">Quota</td><td class="content">'+quotaString+'</td></tr>';
        if(item.name){
            tables += '<tr><td class="title">Name</td><td class="content">'+item.name+'</td></tr>';
        }
        tables += '</table>';
    });
    let body = '<html>' +
    '<head>' +
    '<style>' +
    '@page {margin-left: 0.1cm; margin-right: 0.1cm;}' +
    '.title {min-width:180px;}' +
    '.content {padding-left: 15px;text-align:right}' +
    '@media print { table {page-break-inside: avoid;} }' +
    '</style>' +
    '</head>' +
    '<body onload="setTimeout(function(){window.print();},500)">'+
    tables+
    '</body>' +
    '</html>';
    // var body = '<html>' +
    //     '<head>' +
        // '<style>' +
        // '@page {margin-left: 0.1cm; margin-right: 0.1cm;}' +
        // 'table, th, td {border: none;}' +
        // '</style>' +
    //     '</head>' +
    //     '<body onload="setTimeout(function(){window.print();},500)">' +
    //       '<div>' +
    //         '<h4 style="margin: 0px;">'+setting.general.config.companyName+'</h4>' +
    //         '<h5 style="margin: 0px;">'+setting.general.config.address+'</h5>' +
    //         '<h6 style="margin: 0px;">'+setting.general.config.contact+'</h6>' +
    //         '<h6 style="margin: 0px;">' + storeShop + ': ' + store.name + '</h6>' +
    //       '</div>' +
    //       '<hr style="margin-top: 5px;"><hr style="margin-bottom: 5px;">' +
    //       '<div style="text-align: center">' +
    //       '<h3 style="margin: 0px;"> ' + inventory + ' </h3>'+
    //       '<h6 style="margin: 0px;"> ' + date + ': ' + moment().format('DD.MM.YYYY') + '</h6>'+
    //       '</div>';
    //     body += tablesTotal;
    //     body +=
    //     ('<div class="footer" style="border: none">' +
    //       '<table style="width: 100%; border: none;">' +
    //       '</table>' +
    //       '</div>' +
    //     '</body>' +
    //     '</html>');
    popupWin.document.open();
    popupWin.document.write(body);
    popupWin.document.close();
}
export default { PrintThermal };
