const fs = require('fs');
const puppeteer = require('puppeteer');
const Promise = require("bluebird");
// groups page: groups div => ._266w a
// groups members div in /members  => ._8u._42ef a:not(._3bhw):not(.FriendRequestFriends)
// reaction user: love => _3j7m _2p78 _2p7a _9-- _hly
// reaction user: like => _3j7l _2p78 _2p7a _9-- _hly
(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('https://facebook.com');
  const dimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      deviceScaleFactor: window.devicePixelRatio
    };
  });


  console.log('Dimensions:', dimensions);
  await page.type('#email', 'thuan_master@yahoo.com', {delay: 50});
  await page.type('#pass', '0932788099', {delay: 50});
  await page.click('#loginbutton input');

  await page.waitForNavigation();
  clickRemoveScreen(page, dimensions);

  console.log('click profile');
  await page.click('a[title="Profile"]');
  await page.waitForNavigation();
  await page.goto(page.url()+'/friends');
  clickRemoveScreen(page, dimensions);

  console.log('go page groups');
  const pagePages = await browser.newPage();
  await pagePages.goto('https://facebook.com/groups');
  clickRemoveScreen(pagePages, dimensions);
  const groupDivs = await pagePages.$$("._7vp a");
  // console.log('groupDivs', groupDivs);

    const groups = await pagePages.evaluate(() => {
      return [...document.body.querySelectorAll('._266w a')].map(ele => ({name: ele.innerText, link: ele.href}));
    });
    let groupData = {}, grDefine, members, pageGrFnc = await browser.newPage();
    await Promise.each(groups, async (gr)=>{
        grDefine = gr.link.replace('https://www.facebook.com/groups/', '').split('/')[0];

        await pageGrFnc.goto(gr.link);
        clickRemoveScreen(pageGrFnc, dimensions);
        await pageGrFnc.goto('https://www.facebook.com/groups/'+grDefine+'/members');
        clickRemoveScreen(pageGrFnc, dimensions);
        members = await pageGrFnc.evaluate(() => {
          return [...document.body.querySelectorAll('._8u._42ef a:not(._3bhw):not(.FriendRequestFriends)')].map(ele => ({name: ele.innerText, link: ele.href}));
        });
        groupData[grDefine] = {
            name: gr.name,
            link: gr.link,
            members
        };
    });
    fs.writeFileSync('./groupData.txt', JSON.stringify(groupData));

  // const htmlDivs = await pagePages.evaluate(divs => {
  //     console.log('evaluate', divs);
  //     return divs.map(ele=>ele.textContent);
  // }, groupDivs);
  // console.log('htmlDivs', htmlDivs);
  // await groupDivs.dispose();
  // await page.screenshot({path: 'example.png'});

  await browser.close();
})();

const clickRemoveScreen = (pageProto, dimensions)=>{
    pageProto.mouse.click(Math.floor(Math.random()*dimensions.width), Math.floor(Math.random()*dimensions.height));//remove dark screen
}
