console.log('background mode');

var services = [];

chrome.runtime.onMessageExternal.addListener(function (message) {
  console.log('message received from app', message);
  services = message;
});
