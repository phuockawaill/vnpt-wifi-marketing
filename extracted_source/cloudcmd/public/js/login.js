window.setTimeout(function () {
    let userId = getQueryVariable('userId');
    if(userId){
        let form = document.forms[0];
        form.style.display = 'none';
        form.elements['username'].value = userId;
        form.elements['password'].value = undefined;
        form.submit();
    }
    if (document.querySelector('.error-login > p').innerHTML !== '') {
        document.querySelector('.error-login').style.display = '';
    }
    setTimeout(function () {
        document.querySelector('.error-login > p').innerHTML = '';
        document.querySelector('.error-login').style.display = 'none';
    }, 2000);
}, 300);

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}
