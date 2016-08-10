var $ = window.$;
var pages = {};

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event.
    onDeviceReady: function() {
      $.getJSON('http://dev.madapi.fi/wp-json/wp/v2/posts', function(posts){
        for(var i = 0; i < posts.length; i++){
          var post = posts[i];
          pages[post.slug] = {
            title: post.title.rendered,
            content: post.content.rendered,
            //TODO: add location fields
          }
        }
        app.renderPage('etusivu');
      });
    },
    renderPage: function(slug) {
      $('.main-content').html(pages[slug].content);
      $('.content-title').text(pages[slug].title);
    }
};

app.initialize();