var services = [],
    radios   = [],
    helperApp;

if(!helperApp) {
  connectToHelperApp();
}

chrome.runtime.onMessageExternal.addListener(function (message) {
  console.log("message received from app", message);
  services = message;

  radios = services.map(function(s) {
    return window.Radiodan.create('http://' + s.host + ':' + s.port);
  });
});

function connectToHelperApp() {
  chrome.management.getAll(function(results) {
    var matched = results.filter(function(r) {
      return r.shortName == "radiodan-disco";
    });

    if(matched.length > 0) {
      helperApp = matched[0].id;
      console.log("sending to", helperApp);
      chrome.runtime.sendMessage(helperApp, {subscribe:true});
    } else {
      console.error("cannot find helper app");
    }
  });
}
