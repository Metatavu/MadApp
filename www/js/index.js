var $ = window.$;
var pages = {};

var app = {
  // Application Constructor
  initialize: function () {
    this.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function () {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event.
  onDeviceReady: function () {
    $.getJSON('https://madweek.metatavu.io/wp-json/wp/v2/posts', function (posts) {
      for (var i = 0; i < posts.length; i++) {
        var post = posts[i];
        pages[post.slug] = {
          title: post.title.rendered,
          content: post.content.rendered,
          latitude: post.latitude,
          longitude: post.longitude
        }
      }
      app.renderPage('etusivu');
    });
    $('.menu-item').click(function(){
      var target = $(this).attr('data-target');
      $('.active').removeClass('active');
      $(this).parent().addClass('active');
      $('.navbar-toggle').click();
      app.renderPage(target);
    });
  },
  renderPage: function (slug) {
    $('.main-content').html(pages[slug].content);
    $('.content-title').text(pages[slug].title);
  },
  renderTimeTable: function (date) {
    if (typeof date == 'undefined') {
      var dates = [];
      for (var i = 0; i < pages.length; i++) {
        if (dates.indexOf(pages[i].time.date) == -1) { //TODO: switch to array
          dates.push(pages[i].time.date);
        }
      }
      var moments = [];
      for (var j = 0; j < dates.length; j++) {
        moments.push(moment(dates[j], 'DD.MM.YYYY'));
      }
      moments = moments.sort(function (a, b) {
        if (a.isBefore(b)) {
          return 1;
        } else if (b.isBefore(a)) {
          return -1;
        } else {
          return 0;
        }
      });
      var content = '<ul>';
      for(var n = 0; n < moments.length;n++){
        content += '<li><a href="#">'+moments[n].format('dddd D.M')+'</a></li>';
      }
      $('.main-content').html(content);
      $('.content-title').text('Aikataulu');
    } else {
      var events = [];
      for(var i = 0; i < pages.length;i++) {
        var eventDates = pages[i].times.map( function(eventTime){ return eventTime.date; });
        if(eventDates.indexOf(date) !== -1){
          events.push(pages[i]);
        }
      }
      events = events.sort(function(a, b){
        var aMoment = moment(a.times[date].start);
        var bMoment = moment(b.times[date].start);
        if (aMoment.isBefore(bMoment)) {
          return 1;
        } else if (bMoment.isBefore(aMoment)) {
          return -1;
        } else {
          return 0;
        }
      });
      var content = '<ul>';
      for(var j = 0; j < events.length;j++) {
        content += '<li><a href="'+events[j].slug+'">'+events[j].times[date].start+' - '+events[j].times[date].end+' '+events[j].title+'</a></li>';
      }
      $('.main-content').html(content);
      $('.content-title').text(date);
    }
  }
};

app.initialize();