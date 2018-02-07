function main() {
  var statusElement = document.getElementById('status');
  var ageElement = document.getElementById('age');
  var lastModifiedTimestamp = null;
  var pageName = getPageName();

  function update() {
    var request = new XMLHttpRequest();
    request.addEventListener('load', updateStatus);
    // Add timestamp to url to make sure response isn't cached.
    request.open('GET', pageName+'.txt?time='+Date.now());
    request.send();
    // Give it 5 seconds, then make sure the age warning is updated, whether or not the request
    // returned.
    window.setTimeout(updateAge, 5*1000);
  }

  function updateStatus() {
    statusElement.textContent = this.responseText;
    lastModifiedTimestamp = getAge(ageElement, this.getResponseHeader('Last-Modified'));
    updateAge();
  }

  function updateAge() {
    displayAge(ageElement, lastModifiedTimestamp);
  }

  update();
  window.setInterval(update, 10*1000);
}

function getPageName() {
  var fields = window.location.pathname.split('/');
  var base = fields[fields.length-1];
  fields = base.split('.');
  return fields[0];
}

function getAge(ageElement, lastModified) {
  if (!lastModified) {
    ageElement.textContent = 'Warning: Information of unknown age!';
  }
  return Date.parse(lastModified);
}

function displayAge(ageElement, lastModifiedTimestamp) {
  if (!lastModifiedTimestamp) {
    ageElement.textContent = 'Warning: information of unknown age!';
  }
  var lastModifiedDate = new Date(lastModifiedTimestamp);
  var age = (Date.now() - lastModifiedDate.getTime())/1000;
  if (age > 2*60) {
    ageElement.textContent = 'Warning: This information is '+humanTime(age)+' old!';
  } else {
    ageElement.textContent = '';
  }
}

function humanTime(seconds) {
  if (seconds < 60) {
    return formatTime(seconds, 'second');
  } else if (seconds < 60*60) {
    return formatTime(seconds/60, 'minute');
  } else if (seconds < 24*60*60) {
    return formatTime(seconds/60/60, 'hour');
  } else if (seconds < 10*24*60*60) {
    return formatTime(seconds/60/60/24, 'day');
  } else if (seconds < 40*24*60*60) {
    return formatTime(seconds/60/60/24/7, 'week');
  } else if (seconds < 365*24*60*60) {
    return formatTime(seconds/60/60/24/30.5, 'month');
  } else {
    return formatTime(seconds/60/60/24/365, 'year');
  }
}

function formatTime(quantity, unit) {
  if (quantity < 10) {
    // Round to 1 decimal place if less than 10.
    var rounded = Math.round(quantity*10)/10;
  } else {
    // Round to a whole number if more than 10.
    var rounded = Math.round(quantity);
  }
  var output = rounded + ' ' + unit;
  if (rounded !== 1) {
    output += 's';
  }
  return output;
}

window.addEventListener('load', main);
