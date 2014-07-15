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
  var html = '<ul>',
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

  var items = Array.prototype.slice.call(document.getElementsByTagName('li')),
      uiPage = chrome.extension.getURL('ui/index.html');

  items.forEach(function(li, index) {
    li.addEventListener('click', function() {
      chrome.tabs.create({url: uiPage + '?service=' + urlFor(services[index])});
    });
  });
}
