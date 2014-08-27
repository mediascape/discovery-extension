/*
  The high-level mediascape API.
*/
window.mediascape = (function () {

  var instance = {};

  /*
    Calling `play(url)` injects a device selection 
    UI into the page. If a user chooses a device 
    then the stream is passed to that device.
    If the user closes the UI then the stream is not
    sent.

    Returns {Promise}
      Resolves: with the URL that has been played
      Rejects:  with an error if the user does not select a device
  */
  instance.play = function (url) {
    return new Promise(function (resolve, reject) {
      DeviceList.get()
        .then(function (devices) {
          var div = document.createElement('div');
          div.className = 'mediascape-device-list mediascape-float-panel';
          document.body.appendChild(div);
          return createDeviceListUi(devices, div);
        })
        .then(function (device) {
          play(url, device);
          resolve(url);
        })
        .then(null, function () {
          reject(new Error('User did not give permission to play'));
        });
    });
  };

  /*
    Play an url on a device using the 
    Radiodan client library.
    The first player is assumed.
  */
  function play(url, device) {
    var radio = Radiodan.create('http://'+device.address+':'+device.port);
    var player = radio.player.create(device.txt.players[0].id);
    player.clear()
          .then(function () { return player.add({ playlist: [ url ] }) })
          .then(player.play);
  }

  function urlFor(service) {
    return service.address + ':' + service.port;
  }

  // Track whether a device list selection is in progress
  // We only allow one list to be open at a time.
  var deviceUiPromise;

  /*
    Creates a list of device services in 
    the DOM element container provided.
    Returns a Promise
      Resolves: with a `device` spec if a device is selected
      Rejects:  if no device is selected and the UI is closed
  */
  function createDeviceListUi(services, container) {
    if (deviceUiPromise) {
      return Promise.reject(new Error('Play is already in progress - await user feedback'));
    }

    deviceUiPromise = new Promise(function (resolve, reject) {
      var html = '<p>Select a device to play on:</p><ul>';
      html += services.map(function (service, index) {
        return '<li class="service" data-mediascape-service-index="' + index + '">'
                + service.host
                + '<span class="host">'
                + urlFor(service)
                + '</span>'
               '</li>';
      }).join('');
      html += '<li>Close</li>';
      html += '</ul>';
      container.innerHTML = html;

      container.addEventListener('click', function (evt) {
        console.log('evt.target', evt.target);
        var target = traverseParentsToFindTag( evt.target, 'LI' ),
            index;

        if (target) {
          index = target.getAttribute('data-mediascape-service-index');
        }

        if (index) {
          resolve(services[index]);
        } else {
          reject();
        }

        deviceUiPromise = null;
        container.innerHTML = '';
      })
    });

    return deviceUiPromise;
  };

  /*
    Helper - find ancestor DOM elemenets until 
    tag matches
  */
  function traverseParentsToFindTag(node, tag) {
    if ( tag === node.nodeName ) {
      return node;
    } else if ( node.parentNode ) {
      return traverseParentsToFindTag( node.parentNode, tag );
    }
  }

  return instance;
})();