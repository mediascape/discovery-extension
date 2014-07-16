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
      streams: []
    },
    debug: true
  });

  view.observe('currentPlayer', function (newValue) {
    console.log('Swap global player', newValue);
    window.ui.player = newValue.player;
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

  return playerSpec;

  /*
     Playback controls
     */
  window.ui.playPauseEl = document.querySelector('#play-pause');

  // Listen for the play-pause button to be pressed
  window.ui.playPauseEl.addEventListener('click', handlePlayPause);

  /*
     Trigger either playing or paused when the button
     is clicked
     */
  function handlePlayPause() {
    // Get the current button state
    var currentState = window.ui.playPauseEl.dataset.state;
    if (currentState === 'paused') {
      setPlayState();
      play();
    } else {
      setPauseState();
      pause();
    }
  }

  // Set the button to the playing state
  // and actually start playing
  function setPlayState() {
    window.ui.playPauseEl.dataset.state = 'playing';
  }

  // Set the button to the paused state
  // and tell the player to pause
  function setPauseState() {
    window.ui.playPauseEl.dataset.state = 'paused';
  }

  /*
     Listen for general player state changes
     */
  window.ui.player.on('player', function (info) {
    if (info.state === 'play') {
      setPlayState();
    } else {
      setPauseState();
    }

    if (info.song) {
      setCurrentSong(info.song);
    }

    if (info.nextsong) {
      setNextSong(info.nextsong);
    }
  });

  /*
     Change the volume when the slide is moved
     */
  window.ui.volumeEl = document.querySelector('#volume');
  window.ui.volumeEl.addEventListener('change', function () {
    console.log('Volume', window.ui.volumeEl.value);
    setVolume(window.ui.volumeEl.value);
  });

  /*
     If the player volume is changed elsewhere in the
     system, change the position of the slider
     to match the new volume
     */
  window.ui.audio.on('volume', function(content) {
    console.log('Volume has changed to ', content.volume);
    setVolumeSlider(content.volume);
  });

  function setVolumeSlider(volume) {
    window.ui.volumeEl.value = volume;
  }

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

  /*
     Perform a search
     */
  window.ui.searchPanelEl   = document.querySelector('.search');
  window.ui.searchInputEl   = window.ui.searchPanelEl.querySelector('input');
  window.ui.searchButtonEl  = window.ui.searchPanelEl.querySelector('button');
  window.ui.searchResultsEl = window.ui.searchPanelEl.querySelector('tbody');

  // Perform a search when the text box changes or
  // a button is pressed
  window.ui.searchInputEl.addEventListener('input', performSearch);
  window.ui.searchButtonEl.addEventListener('click', performSearch);

  // Listen for the custom 'searchresults' event fired
  // on the document when results are result
  document.addEventListener('searchresults', populateSearchResults);

  function performSearch() {
    var term = window.ui.searchInputEl.value;
    search(term);
  }

  function populateSearchResults(evt) {
    var results = evt.results,
        html = '';

    if (results.length === 0) {
      html = '<tr><td colspan="5">No search results</td></tr>';
    } else {
      html = evt.results.map(createSearchRowForItem).join('');
    }

    window.ui.searchResultsEl.innerHTML = html;
  }

  function createSearchRowForItem(item) {
    return    '<tr>'
      +   '<td>' + (item.Name || item.Title || '') + '</td>'
      +   '<td>' + (item.Artist || '') + '</td>'
      +   '<td>' + (item.Time || '') + '</td>'
      +   '<td><button class="add no-button" data-file="' + item.file + '"><i class="fa fa-plus-circle"></i></button></td>'
      + '</tr>';
  }

  /*
     Adding a search result
     */
  // Listen for the 'add' button to be pressed on a search result
  window.ui.searchResultsEl.addEventListener('click', handleSearchAddClick);

  function handleSearchAddClick(evt) {
    var targetEl = evt.target,
        file;

    // This will run for any click on the searchResults element
    // If the element clicked is the icon, set the target as the
    // parent button
    if (targetEl.nodeName === 'I') {
      targetEl = targetEl.parentNode;
    }

    // If the target is the button then add to the playlist
    if (targetEl.nodeName === 'BUTTON') {
      file = targetEl.dataset.file;
    }

    if (file) {
      addToPlaylist(file);
    }
  }

  // Get status to do an initial update of
  // the user interface
  window.ui.player.status()
    .then(function (status) {
      if (status.playlist) {
        rebuildPlaylistTable(status.playlist);
      }
      if (status.player.state && status.player.state === 'play') {
        setPlayState();
      } else {
        setPauseState();
      }

      if (status.player.song) {
        setCurrentSong(status.player.song);
      }

      if (status.player.nextsong) {
        setNextSong(status.player.nextsong);
      }
    });

  window.ui.audio.status()
    .then(function (status) {
      if (status.volume) {
        setVolumeSlider(status.volume);
      }
    });
}
