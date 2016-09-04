var $ = window.$;
var eventpages = {};
var frontpage = {};
var infopage = {};
var eventsInitialized = false;
var mapInitialized = false;
var map = null;

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
        switch (post.postType) {
          case 'frontpage':
            frontpage = {
              title: post.title.rendered,
              content: post.content.rendered,
            };
            break;
          case 'info':
            infopage = {
              title: post.title.rendered,
              content: post.content.rendered,
            };
            break;
          case 'event':
            eventpages[post.slug] = {
              title: post.title.rendered,
              content: post.content.rendered,
              latitude: post.blm_latitude,
              longitude: post.blm_longitude
            }
            var slide = $('<div></div>');
            slide.addClass('swiper-slide');
            slide.append($('<div></div>')
              .addClass('swiper-container')
              .addClass('swiper-container-inner')
              .append(
                $('<div></div>')
                  .addClass('swiper-wrapper')
                  .append(
                    $('<div></div>')
                      .addClass('swiper-slide')
                      .append(
                        $('<h3></h3>')
                          .addClass('content-title')
                          .text(post.title.rendered)
                      )
                      .append(
                        $('<div></div>')
                          .addClass('main-content')
                          .html(post.content.rendered)
                      )
                  )
              )
              .append(
                $('<div></div>')
                  .addClass('swiper-scrollbar')
              )
            );
            $('.events-wrapper').append(slide); //TODO: sort
            break;
        }
      }
      app.renderFrontPage();
    });
    $('.menu-item').click(function(){
      var target = $(this).attr('data-target');
      $('.active').removeClass('active');
      $(this).parent().addClass('active');
      $('.navbar-toggle').click();
      switch(target) {
        case 'frontpage':
          app.renderFrontPage();
          break;
        case 'info':
          app.renderInfoPage();
          break;
        case 'events':
          app.renderEventsPage();
          break;
        case 'map':
          app.renderMapPage();
          break;
      }
    });
  },
  renderPage: function (page) {
    $('.default-container .main-content').html(page.content);
    $('.default-container .content-title').text(page.title);
    $('.events-container').hide();
    $('.map-container').hide();
    $('.default-container').show();
  },
  renderFrontPage: function(){
    app.renderPage(frontpage);
  },
  renderInfoPage: function(){
    app.renderPage(infopage);
  },
  renderMapPage: function(){
    $('.default-container').hide();
    $('.events-container').hide();
    $('.map-container').show();
    if(!mapInitialized) {
      mapInitialized = true;
      var layer = new L.StamenTileLayer('watercolor');
      map = new L.Map('map');
      map.addLayer(layer);
      for(var slug in eventpages) {
        if(eventpages.hasOwnProperty(slug)) {
          var event = eventpages[slug];
          var marker = L.marker({
            lat: event.latitude,
            lng: event.longitude
          }).addTo(map);
          marker.on('click', function(event){
            return function(){
              bootbox.dialog({
                title: event.title,
                message: event.content
              });
            };
          }(event));
        }
      }
    }
    navigator.geolocation.getCurrentPosition(function(pos) {
      map.setView({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }, 14);
    }, function(err) {
      //If position is not available for some reason, use mikkeli centre
      map.setView({
        lat: 61.688727,
        lng: 27.272146
      }, 14);
    });
  },
  renderEventsPage: function(){
    $('.default-container').hide();
    $('.map-container').hide();
    $('.events-container').show();
    if(!eventsInitialized) {
      eventsInitialized = true;
      new Swiper('.events-container', {});
      new Swiper('.swiper-container-inner', {
          scrollbar: '.swiper-scrollbar',
          direction: 'vertical',
          slidesPerView: 'auto',
          mousewheelControl: true,
          freeMode: true,
          autoHeight: true
      });
    }
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