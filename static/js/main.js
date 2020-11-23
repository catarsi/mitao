//load json files
//var workflow = JSON.parse(decode_json(workflow));

//var workflow = JSON.parse(JSON.stringify(workflow));
var workflow = JSON.parse(decode_json(workflow));

var config = JSON.parse(decode_json(config));
//console.log("Config:",config);
//console.log("Workflow:",workflow);

var is_release = false;
/* COMMENT IF NOT A RELEASE: Start */
is_release = true;
/* COMMENT IF NOT A RELEASE: End */

var check_updates = !(is_release)

function decode_json(text){
  //var msg = decodeURIComponent(text.replace(/\+/g, '%20')+'');
  var msg = text;
  var parser = new DOMParser;
  var dom = parser.parseFromString('<!doctype html><body>' + msg,'text/html');
  msg = dom.body.textContent;
  //msg = msg.replace(/'/g, '"');
  msg = msg.replace(/[\n\r]/g, '\\n');
  msg = msg.replace(/\\/g, "\\\\");

  return msg;
}

//init the diagram
var diagram_instance = new dipam_diagram(config, workflow);
diagram_instance.set_events();


//Create the interface,
var vw_interface = new dipam_interface();
vw_interface.set_corresponding_diagram(diagram_instance)
vw_interface.set_events();


//******************************************//
//********** First Operations **************//
//******************************************//
vw_interface.build_overview(diagram_instance.get_gen_elem('diagram'));
vw_interface.click_overview_nav();
if (check_updates) {
  vw_interface.check_version();
}
//******************************************//
//********** POP Up Help **************//
//******************************************//

/*
$('.hover_bkgr_fricc').click(function(){
        $('.hover_bkgr_fricc').hide();
});
*/
$('.popupCloseButton').click(function(){
        $('.hover_bkgr_fricc').removeClass("not-active");
        $('.hover_bkgr_fricc').hide();
});


//*** Example ****//
//vw_interface.build_info(diagram_instance.get_gen_elem('data')[0], "nodes");
//vw_interface.click_info_nav();


//When closing the window DIPAM shutdown
//In case it was pagereload triggered from a /loadworkflow -> DIPAM Stay alive
/*
window.onbeforeunload = function (event) {
  if (!vw_interface.in_loading_status) {
    $.get("/shutdown").done(function() {});
  }else {
    vw_interface.in_loading_status = false;
  }
};
*/
