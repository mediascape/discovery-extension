/* jshint laxbreak: true, latedef: nofunc */
/*
  The following helper method are defined in
  playback-controls.js and search.js
*/
/* globals play, pause, nextTrack, previousTrack,
          setVolume, clearPlaylist, removeFromPlaylist,
          addToPlaylist, search
*/
'use strict';

chrome.runtime.getBackgroundPage(buildUI);

var view;

function buildUI(backgroundPage) {

  var serviceId = window.location.search.match(/service=([^&]*)/i)[1],
      services  = backgroundPage.services,
      radiodan  = services[serviceId],
      players   = radiodan.txt.players,
      currentPlayer = players[0];

  setupRadiodan(radiodan);
  players.forEach(function (player) {
    createAndAttachPlayer(player);
  });
  
  view = new Ractive({
    el: '#view',
    template: '#view-template',
    data: {
      currentPlayer: currentPlayer,
      players: players,
      streams: [],
      search: {
        term: '',
        results: []
      },
      volume: null
    },
    debug: true
  });

  view.observe('currentPlayer', function (newValue, oldValue, obj) {
    console.log('Swap global player', newValue, oldValue, obj);
    window.ui.player = newValue.player;
    view.set('search', { term: '', results: [] });
  });

  view.observe('search.term', function (newValue) {
    search(newValue);
  });

  view.on('stream', function (evt) {
    evt.original.preventDefault();
    var url = evt.node.href;
    clearPlaylist()
      .then(function () { addToPlaylist(url) })
      .then(play);
  });

  view.on('next', function (evt) { nextTrack(); });
  view.on('previous', function (evt) { previousTrack(); });

  view.on('clear', function (evt) {
    clearPlaylist();
  });

  view.on('remove', function (evt) {
    var pos = evt.context.Pos;
    removeFromPlaylist(pos);
  });

  view.on('add', function (evt) {
    var file = evt.context.file;
    addToPlaylist(file);
  });

  view.observe('volume', function (newValue, oldValue) {
    console.log('ui volume changed', newValue, oldValue);
    var firstSetting = newValue === null || oldValue === null;
    // Only send updates if change is from UI
    if (!firstSetting) {
      console.log('send state update', newValue);
      setVolume(newValue);
    }
  });

  view.on('play-pause', function handlePlayPause(evt) {
    // Get the current button state
    var currentState = evt.context.currentPlayer.state;
    if (currentState === 'play') {
      pause();
    } else {
      play();
    }
  });

  /*
   Live streams list
  */
  var streamsEl = document.querySelector('.streams');
  window.getJSON(
      'http://bbcradioservices.pixelblend.co.uk/services.json',
      buildServicesList
      );

  function buildServicesList(json) {
    view.set('streams', json.services);
  }
}

function setupRadiodan(service) {
  window.radiodan = window.Radiodan.create('http://'+service.address+':'+service.port);
}

function createAndAttachPlayer(playerSpec) {

  window.ui = window.ui || {};

  playerSpec.player = window.radiodan.player.create(playerSpec.id);
  playerSpec.playlist = [];

  playerSpec.player.on('playlist', function (newPlaylist) {
    console.log('playlist', newPlaylist)
    playerSpec.playlist = newPlaylist;
    view.updateModel();
  });

  /*
    Connect to a Radiodan Player.
    '1' is the ID of the player to
    connect to.
  */
  window.ui.player = playerSpec.player;

  //var audio  = window.radiodan.audio.create('default');
  window.ui.audio  = window.radiodan.audio.create('default');
  //window.ui.audio  = window.ui.player;

  document.addEventListener('searchresults', function (evt) {
    view.set('search.results', evt.results);
  });

// Get status to do an initial update of
  // the user interface
  window.ui.player.status()
    .then(function (status) {
      console.log('player.status', status);

      if (status.playlist) {
        view.set('currentPlayer.playlist', status.playlist);
      }
      if (status.player.state) {
        view.set('currentPlayer.state', status.player.state);
      }

      // if (status.player.song) {
      //   setCurrentSong(status.player.song);
      // }

      // if (status.player.nextsong) {
      //   setNextSong(status.player.nextsong);
      // }
    });

  /*
     Listen for general player state changes
     */
  window.ui.player.on('player', function (info) {
    console.log('info', info);

    if (info.state) {
      view.set('currentPlayer.state', info.state);
    }

    // if (info.song) {
    //   setCurrentSong(info.song);
    // }

    // if (info.nextsong) {
    //   setNextSong(info.nextsong);
    // }
  });

  window.ui.audio.status()
    .then(function (status) {
      var currentVolume = view.get('volume');
      console.log('audio.status', currentVolume, status);
      if (status.volume) {
        if (currentVolume !== status.volume) {
          view.set('volume', status.volume);
        }
      }
    });

  /*
     If the player volume is changed elsewhere in the
     system, change the position of the slider
     to match the new volume
     */
  window.ui.audio.on('volume', function(content) {
    console.log('Volume has changed to ', content.value);
    view.set('volume', content.value);
  });

  return playerSpec;

  /*
     Add an item to the playlist from 'Add to playlist'
     */
  window.ui.addToPlaylistInput  = document.querySelector('.add-to-playlist input');
  window.ui.addToPlaylistButton = document.querySelector('.add-to-playlist button');

  window.ui.addToPlaylistButton.addEventListener('click', handleAddToPlaylist);

  function handleAddToPlaylist() {
    // Handle adding to playlist
    if (window.ui.addToPlaylistInput.value === '') { return; }

    // Add to the player's playlist
    addToPlaylist(window.ui.addToPlaylistInput.value);
  }

  /*
     Show the current and next songs on the playlist
     */
  function setCurrentSong(position) {
    clearCurrentSong();
    var row = window.ui.currentPlaylistEl.children[position];
    if (row) {
      row.classList.add('is-current');
    }
  }

  function clearCurrentSong() {
    var row = window.ui.currentPlaylistEl.querySelector('.is-current');
    if (row) {
      row.classList.remove('is-current');
    }
  }

  function setNextSong(position) {
    clearNextSong();
    var row = window.ui.currentPlaylistEl.children[position];
    if (row) {
      row.classList.add('is-next');
    }
  }

  function clearNextSong() {
    var row = window.ui.currentPlaylistEl.querySelector('.is-next');
    if (row) {
      row.classList.remove('is-next');
    }
  }
}
