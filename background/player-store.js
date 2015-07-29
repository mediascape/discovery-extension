window.PlayerStore = (function () {
  var instance = {},
      players  = {},
      adaptors = {
        '_mediascape-http._tcp.local': window.radiodanPlayer
      };

  instance.findOrCreatePlayerByService = function (service) {
    var name = service.serviceName,
        type = service.serviceType;

    if ( !players[name] ) {
      players[name] = adaptors[type].create(service);
      players[name].name = service.host;
      console.log('Created new player %o of type %o', name, type);
    }

    return players[name];
  }

  return instance;
})();
