const catfishGenerate = (params) => `
    <meta name="viewport" content="width=device-width" />

    <style type="text/css">
        .catfish--container {
            position: fixed;
            height: auto;
            bottom: 0;
            left: 0;
            width: 100%;
            z-index: 2147483647;
            text-align: center;
            display: none;
        }

        .catfish--image {
            width: 100%;
        }

        .catfish--close {
            position: absolute;
            right: 0;
            z-index: 2;
            font-weight: bold;
            background-color: rgba(0, 0, 0, 0.5);
            border: solid 1px #fff;
            padding: 5px;
            color: #fff;
        }

        .catfish--close:hover,
        .catfish--content:hover {
            cursor: pointer;
        }

        .carousel-cell {
            width: 100%;
            height: auto;
        }

        .carousel-cell.is-selected {
            z-index: 1;
        }

        .flickity-prev-next-button {
            z-index: 1;
            background-color: hsla(0, 0%, 100%, 0.5);
        }

        .flickity-page-dots {
            bottom: 10px;
            z-index: 1;
        }

        .flickity-page-dots .dot {
            width: 8px;
            height: 8px;
            opacity: 1;
            background: transparent;
            border: 2px solid white;
        }

        .flickity-page-dots .dot.is-selected {
            background: white;
        }
    </style>

    <div class="catfish--container">
        <button class="catfish--close">Close[x]</button>
        <div class="catfish--content"></div>
    </div>

    <script type="text/javascript">
        (function () {
            var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
            var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
            if (/mobi|iphone|ipod/i.test(navigator.userAgent) && width > height) {
                width = height;
            }

            var platform = width >= 768 ? 'pc' : 'mobile';

            var ads = {
                mobile: '${params.imgMobile}',
                pc: '${params.imgDesktop}'
            };

            function imageClick(e) {
                var linkTracking = m.urlFor('click');
                window.open(linkTracking, '_blank');
            }

            var imageContainer = document.querySelector('.catfish--content');
            function initAd() {
                var imgEle = document.createElement('img');
                imgEle.setAttribute("src", ads[platform]);
                imgEle.className = "carousel-cell-image catfish--image";
                imgEle.addEventListener('click', imageClick);

                imageContainer.appendChild(imgEle);
            }

            var catfishContainer = document.querySelector('.catfish--container');
            function showCatfish() {
                catfishContainer.style.display = 'block';
            }

            function hideCatfish() {
                catfishContainer.parentNode.removeChild(catfishContainer);
            }

            var catfishClose = document.querySelector('.catfish--container .catfish--close');
            catfishClose.addEventListener('click', hideCatfish);

            showCatfish();
            initAd();
        })();
    </script>
`;

export { catfishGenerate };