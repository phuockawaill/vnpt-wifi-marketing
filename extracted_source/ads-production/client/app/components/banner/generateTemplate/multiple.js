import { contentSurveyLogin } from './survey';
import { formDefaultLogin, contentDefaultLogin } from './default';

const contentMulti = (params) => {
    let content = formDefaultLogin(params[0]);

    params.sort((a, b) => {
        if (a.tmpId < b.tmpId) {
            return -1;
        }
        if (a.tmpId > b.tmpId) {
            return 1;
        }
        return 0;
    });

    let paramsLast = params[params.length - 1];
    paramsLast.btnConnected = true;

    params.map(item => {
        if (item.type == 'survey') {
            content += `
                <div id='survey-template-${item.tmpId}' style='display: none'>
                    ${contentSurveyLogin(item)}
                </div>
            `;
        } else {
            content += `
                <div id='login-template-${item.tmpId}' style='display: none'>
                    ${contentDefaultLogin(item)}
                </div>
            `;
        }
    });

    params.map((item, index) => {
        item.priority = index + 1;
        item.isShowSlashPage = false;
        return item;
    });

    content += handleLogin(params);
    return content;
};

const handleLogin = (params) => {
    const checkMail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    const checkPhone = /^0[0-9]{9}[0-9]?$/;
    return `
        <script type="text/javascript">
            document.title = 'WiFiEX4U';
        </script>

        <script type="text/javascript">
            'use strict';
            (function app() {
                var listParams = [];
                var itemData = null;
                var idData = '';
                // VALIDATE
                var checkMail = ${checkMail};
                var checkPhone = ${checkPhone};
                function HandleChangeInput(type) {
                    HandleEventValidateInput(idData, itemData);
                }
                window.HandleChangeInput = HandleChangeInput;
                function showFrame(id, priority) {
                    //$('#' + id + ' #btnData').removeAttr("disabled");
                    if(itemData.type == 'login'){
                        $('#' + id + ' #submit').on('click', function () { 
                            initAd(listParams);
                        });
                    } else {
                        $('#' + id + ' #btnData').on('click', function () { 
                            initAd(listParams);
                        });
                    }
                    document.querySelector('#' + id).style.display = 'block';
                    document.querySelector('#' + id + ' .frame').style.display = 'block';
                }
                window.showFrame = showFrame;
    
                var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
                var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
                if (/mobi|iphone|ipod/i.test(navigator.userAgent) && width > height) {
                    width = height;
                }
                var platform = width >= 1024 ? 'pc' : 'mobile';
                var params = getJsonFromUrl();
                
                function initAd(params) {
                    var listReverse = params.slice();
                    listParams = params.slice();
                    var foundItemShow = listReverse.reverse().find(function(l){
                        return l.isShowSlashPage == true;
                    });
                    if(foundItemShow) {
                        if(foundItemShow.priority < listParams.length){
                            listParams[foundItemShow.priority].isShowSlashPage = true;
                            HandleShowForm(listParams[foundItemShow.priority]);
                            HandleCloseForm(listParams[foundItemShow.priority-1]);
                        } else if(foundItemShow.priority == listParams.length){
                            if(foundItemShow.type == 'login'){
                                switch (foundItemShow.hotspotModel) {
                                    case 'engenius':
                                        formLogin.elements.userurl.value = encodeURIComponent(M.urlFor('click', { m: params.mac }));
                                        formLogin.submit();
                                        break;
                                    case 'aerohive':
                                        M.AerohiveLogin();
                                        break;
                                    case 'ruijie':
                                        window.location.href = decodeURIComponent(M.urlFor('click', {m: params.mac, isRuijie: true}));
                                        break;
                                    default:
                                        var trackingUrl = M.urlFor('click');
                                        formLogin.elements.redirect.value = trackingUrl;
                                        formLogin.submit();
                                        break;
                                }
                            } else {
                                var obj = {};
                                if(foundItemShow.survey && foundItemShow.survey.name) { obj.name = $("#survey-template-" + foundItemShow.tmpId + " #name").val(); }
                                if(foundItemShow.survey && foundItemShow.survey.email) { obj.email = $("#survey-template-" + foundItemShow.tmpId + " #email").val(); }
                                if(foundItemShow.survey && foundItemShow.survey.phone) { obj.phone = $("#survey-template-" + foundItemShow.tmpId + " #phone").val(); }
                                if(foundItemShow.survey && foundItemShow.survey.gender) { obj.gender = $("#survey-template-" + foundItemShow.tmpId + " #gender").val(); }
                                if(foundItemShow.survey && foundItemShow.survey.age) { obj.age = $("#survey-template-" + foundItemShow.tmpId + " #age").val(); }
                                if(foundItemShow.survey && foundItemShow.survey.job) { obj.survey = JSON.stringify({job: $("#survey-template-" + foundItemShow.tmpId + " #job").val()}); }
                                switch (foundItemShow.hotspotModel) {
                                    case 'engenius':
                                        obj.m = params.mac;
                                        formLogin.elements.userurl.value = encodeURIComponent(M.urlFor('click', obj));
                                        formLogin.submit();
                                        break;
                                    case 'aerohive':
                                        M.AerohiveLogin(obj);
                                        break;
                                    case 'ruijie':
                                        obj.isRuijie = true;
                                        obj.m = params.mac;
                                        window.location.href = decodeURIComponent(M.urlFor('click', obj));
                                        break;
                                    default:
                                        formLogin.elements.redirect.value = M.urlFor('click', obj);
                                        formLogin.submit();
                                        break;
                                }
                            }
                        }
                    } else {
                        listParams[0].isShowSlashPage = true;
                        HandleShowForm(listParams[0]);
                    }
                }

                function HandleShowForm(item){
                    itemData = item;
                    var ads = {
                        mobile: item.imgMobile,
                        pc: item.imgDesktop
                    }
    
                    if (item.type == 'survey') {
                        idData = 'survey-template-' + item.tmpId;
                        var adContainer = document.querySelector('#survey-template-' + item.tmpId + ' .ad--survey--image');
                        adContainer.setAttribute("src", ads[platform]);
                        showFrame('survey-template-' + item.tmpId, item.priority);
                        HandleEventValidateInput('survey-template-' + item.tmpId, item);
                    } else {
                        var adContainer = document.querySelector('#login-template-' + item.tmpId + ' .ad--image');
                        adContainer.setAttribute("src", ads[platform]);
                        showFrame('login-template-' + item.tmpId, item.priority);
                    }
                }

                function HandleCloseForm(item){
                    if(item.type == 'survey'){
                        document.querySelector('#survey-template-' + item.tmpId).style.display = 'none';
                    } else {
                        document.querySelector('#login-template-' + item.tmpId).style.display = 'none';
                    }
                }

                function HandleEventValidateInput(id, item){
                    if(item.survey && item.survey.name) {
                        $('#' + id + ' #name').on('input', onInput(id, item));
                    }
                    if(item.survey && item.survey.email) {
                        $('#' + id + ' #email').on('input', onInput(id, item));
                    }
                    if(item.survey && item.survey.phone) {
                        $('#' + id + ' #phone').on('input', onInput(id, item));
                    }
                    if(item.survey && item.survey.gender) {
                        $('#' + id + ' #gender').on('input', onInput(id, item));
                    }
                    if(item.survey && item.survey.age) {
                        $('#' + id + ' #age').on('input', onInput(id, item));
                    }
                    if(item.survey && item.survey.job) {
                        $('#' + id + ' #job').on('input', onInput(id, item));
                    }
                }

                function formValid(id, item) {
                    var name = (item.survey && item.survey.name) ? $("#" + id + " #name").val() : 'name';
                    var gender = (item.survey && item.survey.gender) ? $("#" + id + " #gender").val() : 'gender';
                    var age = (item.survey && item.survey.age) ? $("#" + id + " #age").val() : 'age';
                    var job = (item.survey && item.survey.job) ? $("#" + id + " #job").val() : 'job';
                    var email = (item.survey && item.survey.email) ? $("#" + id + " #email").val() && checkMail.test($("#" + id + " #email").val()) : 'email';
                    var phone = (item.survey && item.survey.phone) ? $("#" + id + " #phone").val() && checkPhone.test($("#" + id + " #phone").val()) : 'phone';
                    return name && gender && age && job && email && phone;
                }

                function onInput(id, item) {
                    if (formValid(id, item)) {
                        $('#' + id + ' #btnData').removeAttr("disabled");
                    } else {
                        $('#' + id + ' #btnData').attr("disabled", true);
                    }
                }

                window.initAd = initAd;
            })();
            initAd(${JSON.stringify(params)});
        </script>
    `;
};

export {
    contentMulti
};