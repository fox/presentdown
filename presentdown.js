window.Presentdown = {}

Presentdown.hashToPage = function () {
  var matches = window.location.hash.match(/#([^\/]+)\/?/)
  if (matches == null) return null
  return matches[1]
}

Presentdown.hashToSlideIndex = function () {
  var matches = window.location.hash.match(/#[^\/]+\/(\d+)/)
  if (matches == null) return 0  
  return parseInt(matches[1]) - 1
}

Presentdown.slideIndex = Presentdown.hashToSlideIndex()
Presentdown.page = Presentdown.hashToPage() || 'readme'

Presentdown.showSlide = function(slide) {
  Presentdown.slideIndex = Math.max(0, Math.min(slide, Presentdown.slides.length - 1))

  $('body')
    .removeClass('slide-' + Presentdown.slideIndex)
    .addClass('slide-' + (Presentdown.slideIndex + 1))

  $('#content')
    .html(this.slides[this.slideIndex])  
    
  $('#progress').css('width', this.slideIndex/(this.slides.length-1) * 100 + '%' )

  window.location.hash = '#' + Presentdown.page + "/" + (Presentdown.slideIndex + 1)
}

Presentdown.nextSlide = function() {
  if (Presentdown.slideIndex < Presentdown.slides.length-1) {
    Presentdown.showSlide(Presentdown.slideIndex+1)
  }
}

Presentdown.prevSlide = function() {
  if (Presentdown.slideIndex > 0) {
    Presentdown.showSlide(Presentdown.slideIndex-1)
  }
}

Presentdown.load = function(page) {  
  $.ajax({
    url: page+'.md',
    cache: false,
    dataType: 'text',
    success: function(markdown) {
      if (markdown.length > 0) {
        markdown = markdown.replace(/\n(#{1,3})/g, "\n!\n\n$1")
        console.log(markdown);
        converter = new Showdown.converter()
        var converted = converter.makeHtml(markdown)
        Presentdown.slides = converted.split('<p>!</p>')
        Presentdown.showSlide(Presentdown.slideIndex)
      }
    }
  })
}

$(function () {
  $(document.body).html("<div id='content'></div><div id='progress'></div>")
    
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
      'swiperight': Presentdown.prevSlide,
      'swipeleft': Presentdown.nextSlide
    })

  $(window)
    .bind('hashchange', function () {
      var slideIndex = Presentdown.hashToSlideIndex()

      if (Presentdown.slideIndex != slideIndex) {
        Presentdown.showSlide(slideIndex)
      }
  })
  
  var pageToJump = ''
  
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
    
  Presentdown.load(Presentdown.page)

})
