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

      players[name].isSupported = function (capability) {
        return (capability in players[name]) ? true : false;
      };
      console.log('Created new player %o of type %o', name, type);
    }

    return players[name];
  }

  return instance;
})();
