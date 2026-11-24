const insertScript = '<script type="text/javascript">"use strict"; function getJsonFromUrl() { var query = location.search.substr(1); var result = {}; decodeURIComponent(query).split("&").forEach(function (part) { var item = part.split("="); result[item[0]] = decodeURIComponent(item[1]); }); return result; }</script>';

const formLogin = ({ hotspotModel }) => {
    switch (hotspotModel) {
        case 'none':
            return '<button class="button" id="submitLoginButton">Use Internet</button>';
        case 'engenius':
            return `
                <form name="formLogin" action="/login" id="formLogin">
                    <input type="hidden" name="userurl"></input>
                    <input type="hidden" id="usr" name="username" value="0">
                    <input type="hidden" id="pswrd" name="password" value="0">
                </form>
            `;
        case 'aerohive':
            return '<form></form>';
        case 'ruijie':
            return `
                <form name="formLogin" style="display: none" action="" method="GET">
                    <input type="hidden" name="token" value="wifiex4u"></input>
                </form>
            `;
        default:
            return `
                <form name="formLogin" id="formLogin" action="/login" method="POST" class="login">
                    <input type="hidden" name="redirect" />
                </form>
            `;
    }
};

const scriptLogin = ({ hotspotModel }) => {
    switch (hotspotModel) {
        case 'none':
            return `
                <script type="text/javascript">
                    'use strict';
                    var generateLogin = true;
                </script>
            `;
        case 'engenius':
            return `
                <script type="text/javascript">
                    'use strict';
                    (function initLogin() {
                        var formLogin = document.formLogin;
                        var params = getJsonFromUrl();
                    
                        function login() {
                            formLogin.elements.userurl.value = encodeURIComponent(M.urlFor('click', { m: params.mac }));
                            formLogin.submit();
                        }
                    
                        var submit = document.getElementById('submitLoginButton');
                        submit.addEventListener('click', function () { login(); });
                    })();
                </script>
            `;
        case 'aerohive':
            return `
                <script type="text/javascript">
                    'use strict';
                    (function initLogin() {
                        var formLogin = document.formLogin;
                        var params = getJsonFromUrl();
                    
                        function login() {
                            M.AerohiveLogin();
                        }
                    
                        var submit = document.getElementById('submitLoginButton');
                        submit.addEventListener('click', function () { login(); });
                    })();
                </script>
            `;
        case 'ruijie':
            return `
                <script type="text/javascript">
                    'use strict';
                    (function initLogin() {
                        var formLogin = document.formLogin;
                        var params = getJsonFromUrl();
                    
                        function login() {
                            window.location.href = decodeURIComponent(M.urlFor('click', { m: params.mac, isRuijie: true }));
                        }
                    
                        var submit = document.getElementById('submitLoginButton');
                        submit.addEventListener('click', function () { login(); });
                    })();
                </script>
            `;
        default:
            return `
                <script type="text/javascript">
                    'use strict';
                    (function initLogin() {
                        var formLogin = document.formLogin;
                        var params = getJsonFromUrl();
                    
                        function login() {
                            var trackingUrl = M.urlFor('click');
                            formLogin.elements.redirect.value = trackingUrl;
                            formLogin.submit();
                        }
                    
                        var submit = document.getElementById('submitLoginButton');
                        submit.addEventListener('click', function () { login(); });
                    })();
                </script>
            `;
    }
};

export {
    insertScript,
    formLogin,
    scriptLogin
};
