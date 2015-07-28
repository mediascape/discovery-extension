var services = [],
    devices  = {},
    helperApp;

if(!helperApp) {
  connectToHelperApp();
}

// No devices
chrome.browserAction.setBadgeText({ text: '0' });

/*
  Listen for messages from content scripts
  requesting playback
*/
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var isContentScript = !!sender.tab;
    if (isContentScript && request.action === 'play') {
      play(request.url, request.deviceName);
    }
    //sendResponse({farewell: "goodbye"});
  }
);

function play(url, deviceName) {
  var deviceInfo = DeviceList.getByServiceName(deviceName);
  deviceInfo.then(function (info) {
    console.log('device info lookup', info);
    var adaptor = PlayerStore.findOrCreatePlayerByService(info);

    adaptor.clear()
      .then(function () { return adaptor.add({ playlist: [ url ] }) })
      .then(adaptor.play);
  });
}

/*
  Listen for messages from Discovery Helper Chrome App
  The messages is always an array of devices found.
*/
chrome.runtime.onMessageExternal.addListener(function (message) {
  console.log("message received from app", message);
  services = message;
  DeviceList.set(message);

  chrome.browserAction.setBadgeText({ text: message.length + '' || '0' });
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
