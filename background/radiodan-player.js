window.radiodanPlayer = (function () {
  var supportedServiceTypes = [
    '_mediascape-http._tcp.local',
    '_radiodan-http._tcp.local'
  ];

  return {
    create: function (service) {
      if ( !_.include(supportedServiceTypes, service.serviceType) ) {
        throw new Error('Unsupport service type ', service.serviceType, ' expected ', supportedServiceTypes);
      }

      var uri = service.uri,
          playerId = service.txt.players[0];

      return Radiodan.create(uri).player.create(playerId);
    }
  };
})();
