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
  var el = document.body;
  el.innerHTML = msg;
}

chrome.runtime.getBackgroundPage(displayMessages);

function urlFor(service) {
  return service.address + ':' + service.port;
}

function displayMessages(backgroundPage) {
  var html = '<ul class="mediascape-device-list">',
      services = backgroundPage.services;

  html += services.map(function (service) {
    return '<li class="service">'
            + service.host
            + '<span class="host">'
            + urlFor(service)
            + '</span>'
           '</li>';
  }).join('');
  html += '</ul>';
  display(html);

  var items = Array.prototype.slice.call(document.getElementsByClassName('service')),
      uiPage = chrome.extension.getURL('ui/index.html');

  items.forEach(function(li, index) {
    li.addEventListener('click', function() {
      chrome.tabs.create({url: uiPage + '?service=' + index});
    });
  });
}
