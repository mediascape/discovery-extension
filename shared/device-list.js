/**
  Singleton representing a list
  of devices. It proxies across the Chrome
  extension boundary and so it can be used
  from the content script and the background
  page
*/
var DeviceList = (function () {

  var instance = {},
      list;

  var MessageTypes = {
    REQUEST_DEVICE_LIST: 'REQUEST_DEVICE_LIST'
  };

  /*
    Listen for device list requests and respond
    with the current list
  */
  chrome.runtime.onMessage.addListener(
    function (message, sender, respond) {
      if (message.type === MessageTypes.REQUEST_DEVICE_LIST) {
        respond(list);
      }
    }
  );

  instance.set = function (newList) {
    list = newList;
  };

  /*
    Requests a list of devices.
    Returns Promise
      Resolves: with a list of devices
  */
  instance.get = function () {
    return new Promise(function (resolve, reject) {
      if (list) {
      resolve(list);
    } else {
      chrome.runtime.sendMessage(
        { type: MessageTypes.REQUEST_DEVICE_LIST },
        function (devices) {
          resolve(devices);
        }
      );
    }
    });
  };

  /*
    Get a specific device by it's service name
  */
  instance.getByServiceName = function (serviceName) {
    var self = this;
    return new Promise(function (resolve, reject) {
      self.get()
        .then(function (list) {
          resolve( _.find(list, { serviceName: serviceName }) );
        });
    });
  };

  return instance;
})()
