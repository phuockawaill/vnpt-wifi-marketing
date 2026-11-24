module.exports = {

  run(editor, sender) {
    let config = editor.Config;
    let pfx = config.stylePrefix;
    let tm = editor.TraitManager;
    tm.addType('slider', {

    });
    let panelC;
    if(!this.obj){
        let confTm = tm.getConfig();
        let canvas = $('.gjs-cv-canvas')[0];
        let zoomCmd = editor.Commands.get('set-zoom');
        let valueZoom = canvas.style['zoom']?canvas.style['zoom'].replace('%',''):100;
        this.obj = $('<div></div>')
        .append('<div class="'+pfx+'traits-label">Zoom view</div>')
        .append('<div class="slidecontainer"><input type="range" min="10" max="100" value="'+valueZoom+'" class="slider" id="myRange"><p><span id="demo"></span>%</p></div>')
        .get(0);
        let panels = editor.Panels;
        if(!panels.getPanel('views-container')){
            panelC = panels.addPanel({id: 'views-container'});
        } else {
            panelC = panels.getPanel('views-container');
        }
        panelC.set('appendContent', this.obj).trigger('change:appendContent');

        let slider = document.getElementById("myRange");
        let output = document.getElementById("demo");
        output.innerHTML = slider.value;
        slider.oninput = function() {
            output.innerHTML = this.value;
            canvas.style['zoom'] = this.value+'%';
        }
    }

    this.obj.style.display = 'block';
  },

  stop() {
    if(this.obj)
      this.obj.style.display = 'none';
  }
};
