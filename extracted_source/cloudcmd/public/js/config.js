window.onload = function () {
    var _username = document.getElementById('InputUsername'),
        _password = document.getElementById('InputPassword'),
        _confirmPassword = document.getElementById('InputConfirmPassword'),
        _rootDir = document.getElementById('InputRootDir'),
        _checkAdmin = document.getElementById('checkAdmin'),
        _pUsername = document.getElementById('pUsername'),
        _pEmail = document.getElementById('pEmail'),
        _pPassword = document.getElementById('pPassword'),
        _pConfirmPassword = document.getElementById('pConfirmPassword'),
        _pConfirmPasswordMatch = document.getElementById('pConfirmPasswordMatch'),
        _pRootDir = document.getElementById('pRootDir'),
        _btnRegister = document.getElementById("btnRegister"),
        _btnUpdate = document.getElementById("btnUpdate");
    var mailReg = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    var _email = document.getElementById('InputEmail');
    /******/
    setInterval(function () {
        var _valid = false;
        _pUsername.style.display = "none";
        _pEmail.style.display = "none";
        _pPassword.style.display = "none";
        _pConfirmPassword.style.display = "none";
        _pConfirmPasswordMatch.style.display = "none";
        _pRootDir.style.display = "none";

        if (_username.value == "") {
            _pUsername.style.display = "block";
        }

        if (!mailReg.test(_email.value)) {
            _pEmail.style.display = "block";
        }

        if (_password.value == "") {
            _pPassword.style.display = "block";
        }

        if (_confirmPassword.value == "") {
            _pConfirmPassword.style.display = "block";
        }

        if (_rootDir.value == "") {
            _pRootDir.style.display = "block";
        }

        if (_username.value != "" && mailReg.test(_email.value) && _password.value != "" && _confirmPassword.value != "" && _rootDir.value != "") {
            if (_password.value === _confirmPassword.value) {
                _valid = true;
            } else {
                _pConfirmPasswordMatch.style.display = "block";
            }
        }

        if (!_valid) {
            _btnRegister.disabled = true;
            _btnUpdate.disabled = true;
        } else {
            _btnRegister.disabled = false;
            _btnUpdate.disabled = false;
        }
    }, 500);
    /******/
};