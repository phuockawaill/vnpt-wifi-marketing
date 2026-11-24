const contentSurveyLogin = (params) => `
    <div class="ad--container-survey">
        <img src="" class="ad--survey--image">
    </div>

    <div class='container frame' frame="survey">
        <div class="form--container">
            <div class="login">
                <p>${(params.survey && params.survey.text) ? params.survey.text : ''}</p>
                ${(params.survey && params.survey.name) ? '<input id="name" type="text" name="name" class="input" placeholder="Tên" oninput="HandleChangeInput()" required /><br />' : ''}
                ${(params.survey && params.survey.email) ? '<input id="email" type="email" name="email" class="input" placeholder="Email" oninput="HandleChangeInput()" required /><br />' : ''}
                ${(params.survey && params.survey.phone) ? '<input id="phone" type="text" name="phone" class="input" placeholder="Số điện thoại" oninput="HandleChangeInput()" required /><br />' : ''}
                ${(params.survey && params.survey.gender) ? `
                        <select id="gender" name="gender" class="input" oninput="HandleChangeInput()" required>
                            <option value="">Giới tính của bạn?</option>
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                        </select>
                        <br />
                    `: ''}
                ${(params.survey && params.survey.age) ? `
                    <select id="age" name="age" class="input" oninput="HandleChangeInput()" required>
                        <option value="">Độ tuổi của bạn?</option>
                        <option value="under_18">Dưới 18</option>
                        <option value="18_to_24">18 tới 24</option>
                        <option value="25_to_34">25 tới 34</option>
                        <option value="35_to_44">35 tới 44</option>
                        <option value="higher_45">Trên 45</option>
                    </select>
                    <br />
                ` : ''}
                ${(params.survey && params.survey.job) ? `
                    <select id="job" name="job" class="input" oninput="HandleChangeInput()" required>
                        <option value="">Nghề nghiệp của bạn?</option>
                        <option value="Bác sĩ">Bác sĩ</option>
                        <option value="Bán hàng">Bán hàng</option>
                        <option value="Bảo hiểm">Bảo hiểm</option>
                        <option value="Bất động sản">Bất động sản</option>
                        <option value="Quản lý, điều hành">Quản lý, điều hành</option>
                        <option value="Chứng khoán">Chứng khoán</option>
                        <option value="Cơ khí">Cơ khí</option>
                        <option value="Giáo dục/Đào tạo">Giáo dục/Đào tạo</option>
                        <option value="Hàng không/Du lịch">Hàng không/Du lịch</option>
                        <option value="Internet/Online Media">Internet/Online Media</option>
                        <option value="IT">IT</option>
                        <option value="Kế toán">Kế toán</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Mỹ thuật/Nghệ thuật">Mỹ thuật/Nghệ thuật</option>
                        <option value="Ngân hàng">Ngân hàng</option>
                        <option value="Nhà hàng/Khách sạn">Nhà hàng/Khách sạn</option>
                        <option value="Thời trang">Thời trang</option>
                        <option value="Thực phẩm">Thực phẩm</option>
                        <option value="Truyền hình/Báo chí">Truyền hình/Báo chí</option>
                        <option value="Xây dựng">Xây dựng</option>
                        <option value="Khác">Khác</option>
                    </select>
                    <br />
                ` : ''}
                ${(params.templateType && params.templateType == 'multiple') ? `
                    <button type="submit" id="btnData" class="login--button" disabled style="color: ${params.btnColor}; background-color: ${params.btnBackground}">${params.btnText}</button>
                ` :
                    `<button type="submit" id="btnData" class="login--button" disabled>${params.btnText}</button>`}
            </div>
        </div>
    </div>
`;

const handleScriptSurveyLogin = (params) => {
    const checkMail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    const checkPhone = /^0[0-9]{9}[0-9]?$/;

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
                    var adContainer = document.querySelector('.ad--survey--image');
                    adContainer.setAttribute("src", ads[platform]);
                    showFrame("survey");
                }
                window.initAd = initAd;

                // VALIDATE
                var checkMail = ${checkMail};
                var checkPhone = ${checkPhone};

                function formValid() {
                    return true ${(params.survey && params.survey.name) ? ' && $("#name").val()' : ''}
                                ${(params.survey && params.survey.gender) ? '&& $("#gender").val()' : ''}
                                ${(params.survey && params.survey.age) ? '&& $("#age").val()' : ''}
                                ${(params.survey && params.survey.job) ? '&& $("#job").val()' : ''}
                                ${(params.survey && params.survey.email) ? '&& $("#email").val() && checkMail.test($("#email").val())' : ''}
                                ${(params.survey && params.survey.phone) ? '&& $("#phone").val() && checkPhone.test($("#phone").val())' : ''}
                }

                function onInput() {
                    if (formValid()) {
                        $('#btnData').removeAttr("disabled");
                    } else {
                        $('#btnData').attr("disabled", true);
                    }
                }

                ${(params.survey && params.survey.name) ? "$('#name').on('input', onInput);" : ""}
                ${(params.survey && params.survey.email) ? "$('#email').on('input', onInput);" : ""}
                ${(params.survey && params.survey.phone) ? "$('#phone').on('input', onInput);" : ""}
                ${(params.survey && params.survey.gender) ? "$('#gender').on('input', onInput);" : ""}
                ${(params.survey && params.survey.age) ? "$('#age').on('input', onInput);" : ""}
                ${(params.survey && params.survey.job) ? "$('#job').on('input', onInput);" : ""}

                var formLogin = document.formLogin;
                var params = getJsonFromUrl();

                $("#btnData").on('click', function () {
                    switch ('${params.hotspotModel}') {
                        case 'engenius':
                            formLogin.elements.userurl.value = encodeURIComponent(M.urlFor('click', {
                                m: params.mac,
                                ${(params.survey && params.survey.name) ? 'name: $("#name").val(),' : ''}
                                ${(params.survey && params.survey.email) ? 'email: $("#email").val(),' : ''}
                                ${(params.survey && params.survey.phone) ? 'phone: $("#phone").val(),' : ''}
                                ${(params.survey && params.survey.gender) ? 'gender: $("#gender").val(),' : ''}
                                ${(params.survey && params.survey.age) ? 'age: $("#age").val(),' : ''}
                                ${(params.survey && params.survey.job) ? 'survey:JSON.stringify({job: $("#job").val()}),' : ''}
                            }));
                            formLogin.submit();
                            break;
                        case 'aerohive':
                            M.AerohiveLogin({
                                ${(params.survey && params.survey.name) ? 'name: $("#name").val(),' : ''}
                                ${(params.survey && params.survey.email) ? 'email: $("#email").val(),' : ''}
                                ${(params.survey && params.survey.phone) ? 'phone: $("#phone").val(),' : ''}
                                ${(params.survey && params.survey.gender) ? 'gender: $("#gender").val(),' : ''}
                                ${(params.survey && params.survey.age) ? 'age: $("#age").val(),' : ''}
                                ${(params.survey && params.survey.job) ? 'survey:JSON.stringify({job: $("#job").val()}),' : ''}
                            });
                            break;
                        case 'ruijie':
                            window.location.href = decodeURIComponent(M.urlFor('click', {
                                m:params.mac,
                                ${(params.survey && params.survey.name) ? 'name: $("#name").val(),' : ''}
                                ${(params.survey && params.survey.email) ? 'email: $("#email").val(),' : ''}
                                ${(params.survey && params.survey.phone) ? 'phone: $("#phone").val(),' : ''}
                                ${(params.survey && params.survey.gender) ? 'gender: $("#gender").val(),' : ''}
                                ${(params.survey && params.survey.age) ? 'age: $("#age").val(),' : ''}
                                ${(params.survey && params.survey.job) ? 'survey:JSON.stringify({job: $("#job").val()}),' : ''}
                                isRuijie: true
                            }));
                            break;
                        default:
                            formLogin.elements.redirect.value = M.urlFor('click', {
                                ${(params.survey && params.survey.name) ? 'name: $("#name").val(),' : ''}
                                ${(params.survey && params.survey.email) ? 'email: $("#email").val(),' : ''}
                                ${(params.survey && params.survey.phone) ? 'phone: $("#phone").val(),' : ''}
                                ${(params.survey && params.survey.gender) ? 'gender: $("#gender").val(),' : ''}
                                ${(params.survey && params.survey.age) ? 'age: $("#age").val(),' : ''}
                                ${(params.survey && params.survey.job) ? 'survey:JSON.stringify({job: $("#job").val()}),' : ''}
                            });
                            formLogin.submit();
                            break;
                    }
                });
            })();

            initAd();
        </script>
    `;
};

export {
    contentSurveyLogin,
    handleScriptSurveyLogin
};