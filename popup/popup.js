/*
  Display a list of found devices on the local 
  network.
  
  When a device is selected, open the remote
  control tab specifying the correct device to 
  connect to.
*/

document.addEventListener('DOMContentLoaded', function () {
  display('Searching...');
});

function display(msg) {
  var el = document.querySelector('.mediascape-ui-panel');
  el.innerHTML = msg;
}

chrome.runtime.getBackgroundPage(displayMessages);

function urlFor(service) {
  return service.address + ':' + service.port;
}

function displayMessages(backgroundPage) {
  var services = backgroundPage.services,
      html = '';

  html += '<h1 class="mediascape-hd">Remote control <span>a radio</span></h1>';
  html += '<ul>';

  html += services.map(function (service) {
    return '<li class="mediascape-device-item">'
            + '<a href="#">' + service.host + '</a>'
           '</li>';
  }).join('');
  html += '</ul>';
  html += '<a class="mediascape-close-btn" href="#">'
  html +=   '<img src="' + chrome.extension.getURL('shared/close-icon.svg') + '" alt="Close">'
  html += '</a>';
  display(html);

  var items = Array.prototype.slice.call(document.querySelectorAll('.mediascape-device-item')),
      uiPage = chrome.extension.getURL('remote/index.html');

  items.forEach(function(li, index) {
    li.addEventListener('click', function() {
      chrome.tabs.create({url: uiPage + '?service=' + index});
    });
  });

  var closeButton = document.querySelector('.mediascape-close-btn');
  closeButton.addEventListener('click', function() {
    window.close();
  });
}
