import axios from 'axios';
const authPath = 'https://auth.s2corp.vn/auth/me';
let UserFnc = null;

axios.defaults.headers["s2corp-sso-token"] = getCookie('s2corp-sso-token');
axios.defaults.headers["s2corp-sso-id"] = getCookie('s2corp-sso-id');

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function checkAuth(setUserFnc){
    UserFnc = setUserFnc;
    window.addEventListener("message", receiveMessage, false);
    axios.get(authPath)
    .then((response) => {
        console.log('Validated user: ', response.data);
        UserFnc(response.data);
      })
    .catch((error)=>{
        if (error.response) {
            console.log(error.response);
          // let wnd = window.open(authPath, "", "width=320,height=300,resizable,scrollbars=yes,status=1");
          // wnd.document.write(error.response.data);
        }
    });
}
function login(){
    window.addEventListener("message", receiveMessage, false);
    axios.get(authPath+'?token='+getCookie('s2corp-sso-token'))
    .then((response) => {
        console.log('Validated user: ', response.data);
        UserFnc(response.data);
      })
    .catch((error)=>{
        if (error.response) {
          let wnd = window.open(authPath+'?token='+getCookie('s2corp-sso-token'), "", "width=320,height=300,resizable,scrollbars=yes,status=1");
          // wnd.document.write(error.response.data);
        }
    });
}
function logout(){
    document.cookie = 's2corp-sso-token=logout; path=/';
    document.cookie = 's2corp-sso-id=; path=/';
}
function receiveMessage(ev){
    if(authPath.indexOf(ev.origin)>-1){
        let dataVerify = ev.data;
        let date = new Date();
        date.setTime(date.getTime()+(60*60*1000));
        console.log('dataVerify', dataVerify);
        document.cookie = 's2corp-sso-token='+dataVerify.token+'; expires='+date.toGMTString()+'; path=/';
        document.cookie = 's2corp-sso-id='+dataVerify.user._id+'; expires='+date.toGMTString()+'; path=/';
        axios.defaults.headers["s2corp-sso-token"] = dataVerify.token;
        axios.defaults.headers["s2corp-sso-id"] = dataVerify.user._id;
        UserFnc(dataVerify.user);
    }
}
const SSOPackage = {
    checkAuth,
    login,
    logout,
    getCookie
};
export default SSOPackage;
