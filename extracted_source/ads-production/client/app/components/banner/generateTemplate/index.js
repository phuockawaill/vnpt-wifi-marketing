import { css } from './style.js';
import { formDefaultLogin, contentDefaultLogin, handleScriptDefaultLogin } from './default';
import { contentSurveyLogin, handleScriptSurveyLogin } from './survey';
import { catfishGenerate } from './catfish';
import { contentMulti } from './multiple';

const generateTemplate = (params) => {
    let content = '';
    let script = '';
    let form = '';
    let customCss = '';

    if (Array.isArray(params)) {
        content = contentMulti(params);
    } else {
        switch (params.templateType) {
            case 'login':
                content = contentDefaultLogin(params);
                script = handleScriptDefaultLogin(params);
                form = formDefaultLogin(params);
                break;
            case 'survey':
                content = contentSurveyLogin(params);
                script = handleScriptSurveyLogin(params);
                form = formDefaultLogin(params);
                break;
            case 'catfish':
                return catfishGenerate(params);
                break;
        }

        customCss = `
            .login--button {
                ${params.btnColor ? `color: ${params.btnColor};` : ''}
                ${params.btnBackground ? `background-color: ${params.btnBackground};` : ''}
            }
        `;
    }

    return `
        <!DOCTYPE html>
        <html>

        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta name="viewport" content="width=device-width" />
            
            <style type="text/css">
                ${css()}
            </style>

            <style type="text/css">
                ${customCss}
            </style>
            
            <script src="https://aeonstatic.genexwifi.com/asset/prudential/js/jquery.min.js"></script>
            <script type="text/javascript">"use strict"; function getJsonFromUrl() { var query = location.search.substr(1); var result = {}; decodeURIComponent(query).split("&").forEach(function (part) { var item = part.split("="); result[item[0]] = decodeURIComponent(item[1]); }); return result; }</script>
        </head>

        <body>
            ${form}
            ${content}
            ${script}
        </body>

        </html>
    `;
};

export {
    generateTemplate
};
