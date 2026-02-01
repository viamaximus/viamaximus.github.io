(function () {
  var clockEl = document.getElementById('clock-time');
  if (!clockEl) return;

  function updateClock() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    // Pad minutes with leading zero
    minutes = minutes < 10 ? '0' + minutes : minutes;

    clockEl.textContent = hours + ':' + minutes + ' ' + ampm;
  }

  // Update immediately and then every minute
  updateClock();
  setInterval(updateClock, 60000);
})();
