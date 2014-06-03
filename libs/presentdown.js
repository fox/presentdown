var Present = {
    // Slide transition effects.
    effects: {
        // n: no effect.
        n: {
            pre: function (view, callback) { callback(); },
            post: function (view) { }
        },
        // f: fade in/out.
        f: {
            pre: function (view, callback) { view.fadeOut('fast', callback); },
            post: function (view) { view.fadeIn('fast'); }
        }
    },
};
Present.currentEffect = Present.effects['n']; // Default slide transiton effect is nothing.

Present.hashToPage = function () {
    var matches = window.location.hash.match(/#(\w+)\/?/);
    if (matches == null) return null;
    return matches[1];
}

Present.hashToSlideIndex = function () {
    var matches = window.location.hash.match(/#\w+\/(\d+)/);
    if (matches == null) return 0;
    return parseInt(matches[1]) - 1;
}

Present.currentSlide = Present.hashToSlideIndex();
Present.currentPage = Present.hashToPage();

Present.showSlide = function(slide) {
  slide = Math.max(0, Math.min(slide, Present.slides.length - 1));
  Present.currentSlide = slide;

  var $view = $('.for-screen .centered');
  this.currentEffect.pre($view, $.proxy(function () {
      $view.html(this.slides[this.currentSlide]);
      this.currentEffect.post($view);
  }, this));

  $('.slideCount select').val(this.currentSlide);
  $('.slideProgress').css("width", (this.currentSlide + 1)/this.slides.length * 100 + "%");
  window.location.hash = '#' + Present.currentPage + "/" + (Present.currentSlide + 1);
};
Present.nextSlide = function() {
  if (Present.currentSlide < Present.slides.length-1) {
    Present.showSlide(Present.currentSlide+1);
  }
};
Present.prevSlide = function() {
  if (Present.currentSlide > 0) {
    Present.showSlide(Present.currentSlide-1);
  }
};

Present.buildSlideCounter = function () {
    var $counter = $('.slideCount select');
    var optionHtmls = [];
    var numOfSlides = this.slides.length;
    $.each(this.slides, function (i) {
        optionHtmls.push('<option value="' + i + '">Slide ' + (i + 1) + ' of ' + numOfSlides + '</option>');
    });
    $counter.html(optionHtmls.join(''));
}

Present.reload = function() {  
    $.ajax({
        url: 'presentations/'+Present.currentPage+'.md',
        cache: false,
        dataType: 'text',
        success: function(data) {
            if (data.length>0) {
                converter = new Showdown.converter();
                var converted = converter.makeHtml(data);
                Present.slides = converted.split('<p>!</p>');
                Present.buildSlideCounter();
                Present.showSlide(Present.currentSlide);
            }
        }
    });
};

if (Present.currentPage) {
  Present.reload();
} else {
  console.error("Page name missing! Set page name like this: " + location.href + "#/page-name")
}

(function () {
    var pageToJump = '';
    var effectCmd = false;

    $(document).keydown(function(e){
        if (e.keyCode == 13) { // enter
            if (pageToJump != '') {
                Present.showSlide(parseInt(pageToJump) - 1);
                pageToJump = '';
            }
        }
        if (48 <= e.keyCode && e.keyCode <= 57) {
            pageToJump += String.fromCharCode(e.keyCode);
        }
        else {
            pageToJump = '';
        }

        // Detect key combination to change slide transition effect. 
        // ex) 'e','f' -> change effect to fade in/out.
        if (e.keyCode == 'E'.charCodeAt(0)) effectCmd = true;
        else if (effectCmd)
        {
            var effectName = String.fromCharCode(e.keyCode).toLowerCase();
            var effect = Present.effects[effectName];
            if (typeof (effect) !== 'undefined') Present.currentEffect = effect;
            effectCmd = false;
        }

        if (e.keyCode == 37) {
            Present.prevSlide();
            return false;
        }
        if (e.keyCode == 39) {
            Present.nextSlide();
            return false;
        }
        if (e.keyCode == 32) { // space
            Present.reload();
            return false;
        }
    });
})();

$(function () {
    var startPos = null;
    var isPointerTypeTouch = function (e) {
        if ('pointerType' in e.originalEvent)
            return (e.originalEvent.pointerType == 'touch');
        else true;
    };
    var getPos = function (e) {
        if ('touches' in e.originalEvent) {
            var touches = e.originalEvent.touches;
            if (touches.length < 1) return { x: 0, y: 0 };
            return { x: touches[0].pageX, y: touches[0].pageY };
        }
        return { x: e.pageX, y: e.pageY };
    };
    var ontouchstart = function (e) {
        if (isPointerTypeTouch(e) === false) return;
        startPos = getPos(e);
    }
    var ontouchmove = function (e) {
        if (startPos === null || isPointerTypeTouch(e) === false) return;
        var pos = getPos(e);
        var d = { x: startPos.x - pos.x, y: startPos.y - pos.y };
        if (Math.abs(d.x) >=40) {
            startPos = null;
            $(this).trigger(d.x < 0 ? 'swiperight' : 'swipeleft');
            return false;
        }
    }
    var ontouchend = function (e) {
        if (startPos === null || isPointerTypeTouch(e) === false) return;
        startPos = null;
    }

    var hideaddressbar = function () {
        setTimeout(function () { window.scrollTo(0, 1); }, 100);
    };

    $(document.body)
        .bind({
            // IE10
            'MSPointerDown': ontouchstart,
            'MSPointerMove': ontouchmove,
            'MSPointerUp': ontouchend,
            
            // IE11+
            'pointerdown': ontouchstart,
            'pointermove': ontouchmove,
            'pointerup': ontouchend,
            
            // Webkit, Gecko
            'touchstart': ontouchstart,
            'touchmove': ontouchmove,
            'touchend': ontouchend,
            'swiperight': function () {
                Present.prevSlide();
                hideaddressbar();
            },
            'swipeleft': function () {
                Present.nextSlide();
                hideaddressbar();
            }
        });

    hideaddressbar();

    $(window).bind('orientationchange', hideaddressbar);
});

// Go to page by hash of URL changed.
$(window).bind('hashchange', function () {
    var slideIndex = Present.hashToSlideIndex();
    if (Present.currentSlide != slideIndex)
        Present.showSlide(slideIndex);
});

// Go to page by drop down list changed.
$('.slideCount select').change(function () {
    Present.showSlide(parseInt($(this).val()));
    setTimeout(function () { document.body.focus(); }, 0);
});
