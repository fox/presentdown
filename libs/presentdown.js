window.Presentdown = {}

Presentdown.effects = {}
Presentdown.effects.none = {
  pre: function (view, callback) { callback() },
  post: function (view) { }
}

Presentdown.effects.fade = {
  pre: function (view, callback) { callback() },
  post: function (view) { }
}

// no effects for now
Presentdown.currentEffect = Presentdown.effects.none

Presentdown.hashToPage = function () {
  var matches = window.location.hash.match(/#(\w+)\/?/)
  if (matches == null) return null
  
  return matches[1]
}

Presentdown.hashToSlideIndex = function () {
  var matches = window.location.hash.match(/#\w+\/(\d+)/)
  if (matches == null) return 0
  
  return parseInt(matches[1]) - 1
}

Presentdown.currentSlide = Presentdown.hashToSlideIndex()
Presentdown.currentPage = Presentdown.hashToPage()

Presentdown.showSlide = function(slide) {
  var slide = Math.max(0, Math.min(slide, Presentdown.slides.length - 1))
  Presentdown.currentSlide = slide

  $('body')
    .removeClass('slide-' + Presentdown.currentSlide)
    .addClass('slide-' + (Presentdown.currentSlide + 1))

  var $view = $('#content')
  
  this.currentEffect.pre($view, $.proxy(function () {
    $view.html(this.slides[this.currentSlide])
    this.currentEffect.post($view)
  }, this))

  $('#progress').css("width", (this.currentSlide + 1)/this.slides.length * 100 + "%")
  
  window.location.hash = '#' + Presentdown.currentPage + "/" + (Presentdown.currentSlide + 1)
}

Presentdown.nextSlide = function() {
  if (Presentdown.currentSlide < Presentdown.slides.length-1) {
  Presentdown.showSlide(Presentdown.currentSlide+1)
  }
}

Presentdown.prevSlide = function() {
  if (Presentdown.currentSlide > 0) {
  Presentdown.showSlide(Presentdown.currentSlide-1)
  }
}

Presentdown.load = function() {  
  $.ajax({
    url: 'presentations/'+Presentdown.currentPage+'.md',
    cache: false,
    dataType: 'text',
    success: function(data) {
      if (data.length>0) {
        converter = new Showdown.converter()
        var converted = converter.makeHtml(data)
        Presentdown.slides = converted.split('<p>!</p>')
        Presentdown.showSlide(Presentdown.currentSlide)
      }
    }
  })
}

if (Presentdown.currentPage) {
  
  Presentdown.load()
} else {
  console.error("Page name missing! Set page name like this: " + location.href + "#/page-name")
}

(function () {
  var pageToJump = ''
  var effectCmd = false

  $(document).keydown(function(e){
    if (e.keyCode == 13) { // enter
      if (pageToJump != '') {
        Presentdown.showSlide(parseInt(pageToJump) - 1)
        pageToJump = ''
      }
    }
    
    if (48 <= e.keyCode && e.keyCode <= 57) {
      pageToJump += String.fromCharCode(e.keyCode)
    }
    else {
      pageToJump = ''
    }
    
    if (e.keyCode == 37) {
      Presentdown.prevSlide()
      return false
    }
    if (e.keyCode == 39) {
      Presentdown.nextSlide()
      return false
    }
  })
})()

$(function () {
  
  var startPos = null
  var isPointerTypeTouch = function (e) {
    if ('pointerType' in e.originalEvent)
      return (e.originalEvent.pointerType == 'touch')
    else true
  }
  
  var getPos = function (e) {
    if ('touches' in e.originalEvent) {
      var touches = e.originalEvent.touches
      if (touches.length < 1) return { x: 0, y: 0 }
      return { x: touches[0].pageX, y: touches[0].pageY }
    }
    return { x: e.pageX, y: e.pageY }
  }
  
  var onTouchStart = function (e) {
    if (isPointerTypeTouch(e) === false) return
    startPos = getPos(e)
  }
  
  var onTouchMove = function (e) {
    if (startPos === null || isPointerTypeTouch(e) === false) return
    var pos = getPos(e)
    var d = { x: startPos.x - pos.x, y: startPos.y - pos.y }
    if (Math.abs(d.x) >=40) {
      startPos = null
      $(this).trigger(d.x < 0 ? 'swiperight' : 'swipeleft')
      return false
    }
  }
  
  var onTouchEnd = function (e) {
    if (startPos === null || isPointerTypeTouch(e) === false) return
    startPos = null
  }

  var hideAddressBar = function () {
    setTimeout(function () { window.scrollTo(0, 1) }, 100)
  }

  $(document.body)
    .bind({
      // IE10
      'MSPointerDown': onTouchStart,
      'MSPointerMove': onTouchMove,
      'MSPointerUp': onTouchEnd,
      
      // IE11+
      'pointerdown': onTouchStart,
      'pointermove': onTouchMove,
      'pointerup': onTouchEnd,
      
      // Webkit, Gecko
      'touchstart': onTouchStart,
      'touchmove': onTouchMove,
      'touchend': onTouchEnd,
      'swiperight': function () {
        Presentdown.prevSlide()
        hideAddressBar()
      },
      'swipeleft': function () {
        Presentdown.nextSlide()
        hideAddressBar()
      }
    })

  hideAddressBar()

  $(window).bind('orientationchange', hideAddressBar)
})

$(window).bind('hashchange', function () {
  var slideIndex = Presentdown.hashToSlideIndex()

  if (Presentdown.currentSlide != slideIndex)
    Presentdown.showSlide(slideIndex)
})
