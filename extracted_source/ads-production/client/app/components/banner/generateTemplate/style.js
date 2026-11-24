const css = () => `
    html {
        color: #000000;
        font-size: 14px;
        font-family: Verdana, Geneva, sans-serif;
    }

    input,
    select,
    p,
    span {
        font-size: 14px;
    }

    body {
        padding: 0;
        margin: 0;
        background-color: #ffffff;
    }

    header {
        width: 100%;
        text-align: center;
    }

    a:hover {
        color: #009fda;
    }

    p {
        font-size: 1em;
    }

    h1 {
        font-size: 1.8em;
        text-align: center;
        font-weight: 300;
    }

    textarea {
        font-size: 0.9em;
    }

    .login--button {
        -webkit-border-radius: 28;
        -moz-border-radius: 28;
        border-radius: 28px;
        box-shadow: 0px 17px 10px -10px rgba(0, 0, 0, 0.4);
        font-family: Arial;
        font-size: 20px;
        padding: 10px 20px 10px 20px;
        text-decoration: none;
        width: 200px;
        margin: auto;
        width: 200px;
        margin: auto;
        border: none;
        outline: none;
        cursor: pointer;
    }

    .login--button:hover {
        box-shadow: 0px 37px 20px -20px rgba(0, 0, 0, 0.2);
        transform: translate(0px, -5px) scale(1);
    }

    .login--button:active {
        outline: none;
    }

    .login--button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .ad--container {
        display: block;
        position: absolute;
        bottom: 0;
        top: 0;
        left: 0;
        width: 100%;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: top;
        text-align: center;
        background: white;
    }

    .ad--container .ad--image {
        max-height: 100%;
        width: auto;
        max-width: 100%;
    }

    .ad--container .login--button {
        position: absolute;
        bottom: 50px;
        left: 50%;
        margin-left: -100px;
        z-index: 9;
    }

    /* Survey */
    .ad--container-survey {
        display: block;
        width: 100%;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: top;
        text-align: center;
        background: white;
    }

    .container {
        width: 100%;
        max-width: 100%;
        text-align: center;
        margin: auto;
        margin-bottom: 30px;
    }

    .ad--survey--image {
        max-height: 100%;
        width: auto;
        max-width: 100%;
    }

    .form--container {
        width: 95%;
        margin: auto;
    }

    .login {
        text-align: center;
    }

    .login .input {
        font-size: 1.4em;
        line-height: 35px;
        margin-bottom: 10px;
        padding: 5px 15px 5px 10px;
        width: 100%;
        color: #002395;
        border-radius: 5px;
        border: solid 1px #009fda;
        outline: none;
        box-sizing: border-box;
    }

    .login select.input {
        background-color: #ffffff;
        height: 47px;
    }

    .login .input:focus {
        border-color: #002395;
    }

    /* desktop */
    @media screen and (min-width: 1024px) {
        .ad--container .login--button {
            position: absolute;
            bottom: 0%;
            top: 0;
            left: 0;
            right: 0;
            height: 50px;
            margin: auto;
        }

        body {
            font-size: 16px;
        }

        header {
            text-align: left;
        }

        .ad--container {
            background-size: cover;
            background-position: center;
        }

        /* Survey */
        .ad--container-survey {
            background-size: cover;
            background-position: center;
        }

        .form--container {
            max-width: 450px;
        }
    }

    .frame {
        display: none;
    }
`;

export { css };
