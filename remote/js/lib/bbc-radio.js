(function (exports) {
  'use strict';

  var obj = {
    playlistFormat: 'http://open.live.bbc.co.uk/mediaselector/5/select/mediaset/http-icy-mp3-a/vpid/$station/format/pls.pls',
    playableLinks: function (container) {
      return container.querySelectorAll('a[data-player-html5-stream]');
    },
    playlistUrl: function playlistUrl(el) {
      console.log('playlistUrl( %o )', el);
      return new Promise(function (resolve, reject) {
        var station = el.getAttribute('href').split('/').pop(),
            playlistUrl;

        if(station == '') {
          reject(playlistUrl);
        } else {
          console.log('o', obj);
          playlistUrl = obj.playlistFormat.replace('$station', station);
          resolve(playlistUrl);
        }
      });
    },
    extractStreamForUrl: function (url) {
      return obj.fetchPlsForUrl(url)
              .then(obj.parseStreamFromPls);
    },
    fetchPlsForUrl: function (url) {
      return xhr.get(url);
    },
    parseStreamFromPls: function (data) {
      return new Promise(function (resolve, reject) {
        var matches = data.match(/File[\d]=(.*)/);
        matches && matches.length > 1 ? resolve(matches[1]) : reject();
      });
    }
  }

  exports.radio = obj;

})(window.bbc = window.bbc || {})
