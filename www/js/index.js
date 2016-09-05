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
    moment.locale('fi');
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
            var open = JSON.parse(post.open);
            eventpages[post.slug] = {
              slug: post.slug,
              title: post.title.rendered,
              content: post.content.rendered,
              latitude: post.blm_latitude,
              longitude: post.blm_longitude,
              dates:open.map( function(eventOpen){ return eventOpen.date; }), 
              open: open.map( function(eventOpen){ 
                return {
                  date: eventOpen.date,
                  opens: moment(eventOpen.date +' '+eventOpen.opens, 'D.M. H:mm'),
                  closes: moment(eventOpen.date +' '+eventOpen.closes, 'D.M. H:mm') 
                };
              })
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
        case 'timetable':
          app.renderTimeTable();
          break;
      }
    });
    $(document).on('click', '.date-timetable', function(){
      var date = $(this).attr('data-date');
      app.renderTimeTable(date);
    });
    $(document).on('click', '.show-event-data', function(){
      var slug = $(this).attr('data-slug');
      var event = eventpages[slug];
      bootbox.dialog({
        title: event.title,
        message: event.content
      });
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
      map.setView({
        lat: 61.688727,
        lng: 27.272146
      }, 14);
    }
    navigator.geolocation.getCurrentPosition(function(pos) {
      map.setView({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }, 14);
    }, function(err) {
      //If position is not available for some reason, use mikkeli centre which is already initialized
    });
  },
  renderEventsPage: function(){
    $('.default-container').hide();
    $('.map-container').hide();
    $('.events-container').show();
    if(!eventsInitialized) {
      eventsInitialized = true;
      new Swiper('.events-container', { });
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
      for(var slug in eventpages) {
        if(eventpages.hasOwnProperty(slug)) {
          var event = eventpages[slug];
          for(var i = 0; i < event.dates.length; i++) {
            if (dates.indexOf(event.dates[i]) == -1) {
              dates.push(event.dates[i]);
            }
          }
        }
      }
      var moments = [];
      for (var j = 0; j < dates.length; j++) {
        moments.push(moment(dates[j], 'D.M.'));
      }
      moments = moments.sort(function (a, b) {
        if (a.isBefore(b)) {
          return -1;
        } else if (b.isBefore(a)) {
          return 1;
        } else {
          return 0;
        }
      });
      var content = '<table class="table">';
      for(var n = 0; n < moments.length;n++){
        content += '<tr><td><a data-date="'+moments[n].format('D.M.')+'" class="date-timetable" href="#">'+moments[n].format('dddd D.M')+'</a></td></tr>';
      }
      content += '</table>';
      $('.default-container .main-content').html(content);
      $('.default-container .content-title').text('Aikataulu');
      $('.events-container').hide();
      $('.map-container').hide();
      $('.default-container').show();
    } else {
      var events = [];
      for(var slug in eventpages) {
        if(eventpages.hasOwnProperty(slug)) {
          var event = eventpages[slug];
          if(event.dates.indexOf(date) !== -1){
            events.push(event);
          }
        }
      }
      for(var i = 0; i < events.length;i++) {
        for(var j = 0; j < events[i].open.length;j++){
          if(events[i].open[j].date == date) {
            events[i].currentOpen = events[i].open[j];
            break;
          }
        }
      }
      events = events.sort(function(a, b){
        if (a.currentOpen.opens.isBefore(b.currentOpen.opens)) {
          return -1;
        } else if (b.currentOpen.opens.isBefore(a.currentOpen.opens)) {
          return 1;
        } else {
          return 0;
        }
      });
      var content = '<table class="table">';
      for(var j = 0; j < events.length;j++) {
        content += '<tr><td><a class="show-event-data" data-slug="'+events[j].slug+'" href="#">'+events[j].currentOpen.opens.format('H:mm')+' - '+events[j].currentOpen.closes.format('H:mm')+' '+events[j].title+'</a></td></tr>';
      }
      content += '</table>';
      $('.default-container .main-content').html(content);
      $('.default-container .content-title').text(moment(date, 'D.M.').format('dddd D.M.'));
      $('.events-container').hide();
      $('.map-container').hide();
      $('.default-container').show();
    }
  }
};

app.initialize();