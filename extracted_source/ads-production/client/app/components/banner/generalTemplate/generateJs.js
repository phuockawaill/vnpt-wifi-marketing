import _forEach from 'lodash/forEach';
const Generate = (data)=>{
    console.log(data);
    let returnString = "<script>'use strict';(function app() {var checkPhone = /^0[0-9]{9}[0-9]?$/;";
    let iValidVars = [];
    let trackingVars = {survey: {}}, surveyString = '';
    if(data.name){returnString+="  var name = document.getElementById('"+data.name+"');name.addEventListener('input', onInput); ";iValidVars.push('name.value');trackingVars.name="name.value";}
    if(data.phone){returnString+="  var phone = document.getElementById('"+data.phone+"');phone.addEventListener('input', onInput); ";iValidVars.push('checkPhone.test(phone.value)');trackingVars.phone="phone.value";}
    if(data.email){returnString+="  var email = document.getElementById('"+data.email+"');email.addEventListener('input', onInput); ";iValidVars.push('email.value');trackingVars.email="email.value";}
    if(data.gender){returnString+="  var gender = document.getElementById('"+data.gender+"');gender.addEventListener('input', onInput); ";iValidVars.push('gender.value');trackingVars.gender="gender.value";}
    if(data.age){returnString+="  var age = document.getElementById('"+data.age+"');age.addEventListener('input', onInput); ";iValidVars.push('age.value');trackingVars.age="age.value";}
    if(data.income){returnString+="  var income = document.getElementById('"+data.income+"');income.addEventListener('input', onInput); ";iValidVars.push('income.value');trackingVars.income="income.value";}
    if(data.country){returnString+="  var country = document.getElementById('"+data.country+"');country.addEventListener('input', onInput); ";iValidVars.push('country.value');trackingVars.country="country.value";}
    if(data.favorite){returnString+="  var favorite = document.getElementById('"+data.favorite+"');favorite.addEventListener('input', onInput); ";iValidVars.push('favorite.value');trackingVars.favorite="favorite.value";}
    data.survey.forEach((val)=>{returnString+= "var "+val+" = document.getElementById('"+val+"');"+val+".addEventListener('input', onInput);";iValidVars.push(val+'.value');trackingVars.survey[val]=val+".value";});
    _forEach(trackingVars.survey, (val, key)=>{
        surveyString += key+"||'+"+val+"+'||";
    });
    trackingVars.survey = "'"+surveyString+"'";
    returnString+="var loginEle = document.getElementById('"+data.buttonId+"');loginEle.addEventListener('click', login);"
    returnString+="function isValid() {return "+iValidVars.toString().replace(/,/g , " && ")+"; }";
    returnString+="function onInput() {if (isValid()) {loginEle.removeAttribute('disabled');} else {loginEle.setAttribute('disabled', true);} }";
    returnString+="var formLogin = document."+data.formName+";formLogin.method='"+data.method+"';formLogin.action='"+data.actionurl+"';";
    returnString+="function login() {formLogin.action='"+data.actionurl+"';var trackingUrl = GN.urlFor('click', "+JSON.stringify(trackingVars).replace(/"/g , "")+");formLogin.elements."+data.userurl+".value = trackingUrl;formLogin.submit();}";
    returnString+="})();</script>";
    return returnString
      /* Validation */

      //     var trackingUrl = GN.urlFor('click', {
      //       name: name.value ,
      //       phone: phone.value,
      //       gender: gender.value,
      //       age: age.value,
      //       survey: JSON.stringify({ job: job.value })
      //     });
    //
    //
    //
    //   var frames = document.querySelectorAll('.frame');
    //   function showFrame(id) {
    //     Array.prototype.forEach.call(frames, function (frame) {
    //       var frameId = frame.getAttribute("frame");
    //       if (frameId === id) {
    //         frame.style.display = "block";
    //       } else {
    //         frame.style.display = "none";
    //       }
    //     });
    //   }
    //   window.showFrame = showFrame;
    //
    //   var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    //   var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
    //   if (/mobi|iphone|ipod/i.test(navigator.userAgent) && width > height) {
    //     width = height;
    //   }
    //   var platform = width >= 1024 ? 'pc' : 'mobile';
    //
    //   var ads = {
    //     '18_to_24': {
    //       mobile: 'http://demo.wifiportal.vn:20080/resource/demo/acb/tiet-kiem-tuong-lai/18-24-mobile.jpg',
    //       pc: 'http://demo.wifiportal.vn:20080/resource/demo/acb/tiet-kiem-tuong-lai/18-24-pc.jpg'
    //     },
    //     '25_to_34': {
    //       mobile: 'http://demo.wifiportal.vn:20080/resource/demo/acb/tiet-kiem-tuong-lai/25-34-mobile.jpg',
    //       pc: 'http://demo.wifiportal.vn:20080/resource/demo/acb/tiet-kiem-tuong-lai/25-34-pc.jpg'
    //     },
    //     '35_to_44': {
    //       mobile: 'http://demo.wifiportal.vn:20080/resource/demo/acb/tiet-kiem-tuong-lai/35-44-mobile.jpg',
    //       pc: 'http://demo.wifiportal.vn:20080/resource/demo/acb/tiet-kiem-tuong-lai/35-44-pc.jpg'
    //     },
    //     'higher_45': {
    //       mobile: 'http://demo.wifiportal.vn:20080/resource/demo/acb/tiet-kiem-tuong-lai/35-44-mobile.jpg',
    //       pc: 'http://demo.wifiportal.vn:20080/resource/demo/acb/tiet-kiem-tuong-lai/35-44-pc.jpg'
    //     }
    //   }
    //
    //   function initAd(age) {
    //     var adContainer = document.querySelector('.ad--image');
    //     adContainer.setAttribute("src", ads[age][platform]);
    //     showFrame("ad");
    //
    //     var loginEle = document.getElementById('submit');
    //     loginEle.addEventListener('click', login);
    //   }
    //   window.initAd = initAd;
    //

    //
    //   submit.addEventListener('click', function() {
    //     if (age.value in ads) {
    //       return initAd(age.value);
    //     }
    //     login();
    //   });
    // })();
};
export default Generate;
