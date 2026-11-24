module.exports = {

  run(editor, sender) {
    let config = editor.Config;
    let pfx = config.stylePrefix;
    let panelC;
    if(!this.obj){
        let canvas = $('.gjs-cv-canvas')[0];
        let jsVal = editor.getConfig().js;
        this.obj = $('<div></div>')
        .append('<div class="'+pfx+'traits-label">JS Embed Code</div>')
        .append('<textarea id="jsCodeHtml" style="width: calc(100% - 20px); margin: 0 10px; background: rgba(0,0,0,0.2); border: none; height:calc('+config.height+' - 100px)">'+jsVal+'</textarea>')
        .get(0);
        let panels = editor.Panels;
        if(!panels.getPanel('views-container')){
            panelC = panels.addPanel({id: 'views-container'});
        } else {
            panelC = panels.getPanel('views-container');
        }
        panelC.set('appendContent', this.obj).trigger('change:appendContent');

        let jsCodeHtml = document.getElementById("jsCodeHtml");
        jsCodeHtml.oninput = function() {
            config.js = this.value;
        }
    }

    this.obj.style.display = 'block';
  },

  stop() {
    if(this.obj)
      this.obj.style.display = 'none';
  }
};
