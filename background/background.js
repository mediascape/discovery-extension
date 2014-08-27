var services = [],
    radios   = [],
    helperApp;

if(!helperApp) {
  connectToHelperApp();
}

/*
  Listen for messages from Discovery Helper Chrome App
  The messages is always an array of devices found.
*/
chrome.runtime.onMessageExternal.addListener(function (message) {
  console.log("message received from app", message);
  services = message;
  DeviceList.set(message);
});

/*
  Subscribe to messages from the Discovery Helper 
  Chrome App. 
  This is required so the helper knows
  which ID to send messages to.
*/
function connectToHelperApp() {
  chrome.management.getAll(function(results) {
    var matched = results.filter(function(r) {
      return r.shortName == "mediscape-discovery-helper";
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
