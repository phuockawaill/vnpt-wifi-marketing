const formDefaultLogin = (params) => {
    switch (params.hotspotModel) {
        case 'engenius':
            return `
                <form name="formLogin" action="/login" id="formLogin">
                    <input type="hidden" name="userurl"></input>
                    <input type="hidden" id="usr" name="username" value="0">
                    <input type="hidden" id="pswrd" name="password" value="0">
                </form>
            `;
            break;
        case 'aerohive':
            return '<form></form>';
            break;
        case 'ruijie':
            return `
                <form name="formLogin" style="display: none" action="" method="GET">
                    <input type="hidden" name="token" value="wifiex4u"></input>
                </form>
            `;
            break;
        default:
            return `
                <form name="formLogin" id="formLogin" action="/login" method="POST" class="login">
                    <input type="hidden" name="redirect" />
                </form>
            `;
            break;
    }
};

const contentDefaultLogin = (params) => `
    <div class="frame ad--container" frame="ad">
        <img src="" class="ad--image">
        ${(params.templateType && params.templateType == 'multiple') ? `
        <button type="submit" id="submit" class="login--button" style="color: ${params.btnColor}; background-color: ${params.btnBackground}">${params.btnText}</button>
                ` :
        `<button type="submit" id="submit" class="login--button">${params.btnText}</button>`}
    </div>
`;

const handleScriptDefaultLogin = (params) => {
    return `
        <script type="text/javascript">
            document.title = 'WiFiEX4U';
        </script>

        <script type="text/javascript">
            'use strict';
            (function app() {
                var frames = document.querySelectorAll('.frame');
                function showFrame(id) {
                    Array.prototype.forEach.call(frames, function (frame) {
                        var frameId = frame.getAttribute("frame");
                        if (frameId === id) {
                            frame.style.display = "block";
                        } else {
                            frame.style.display = "none";
                        }
                    });
                }
                window.showFrame = showFrame;

                var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
                var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
                if (/mobi|iphone|ipod/i.test(navigator.userAgent) && width > height) {
                    width = height;
                }
                var platform = width >= 1024 ? 'pc' : 'mobile';

                var ads = {
                    mobile: '${params.imgMobile}',
                    pc: '${params.imgDesktop}'
                }

                function initAd() {
                    var adContainer = document.querySelector('.ad--image');
                    adContainer.setAttribute("src", ads[platform]);
                    showFrame("ad");

                    var loginEle = document.getElementById('submit');
                    loginEle.addEventListener('click', login);
                }
                window.initAd = initAd;

                var formLogin = document.formLogin;
                var params = getJsonFromUrl();

                function login() {
                    switch ('${params.hotspotModel}') {
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
                }

                var submit = document.getElementById('submit');
                submit.addEventListener('click', function () {
                    login();
                });
            })();

            initAd();
        </script>     
    `;
};

export {
    formDefaultLogin,
    contentDefaultLogin,
    handleScriptDefaultLogin
};