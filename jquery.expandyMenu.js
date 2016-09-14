/* 
 ** Forked code from https://github.com/jmar777/kwicks/blob/master/jquery.kwicks.js 
 ** Pulled expand code
 ** Added toggle functionality
 */
(function($) {
  
  jQuery.fn.Menu = function(options) {
    var defaults = {
      button: $('#toggle'),
      duration: 500,
      easing: 'easeOutCubic',
      minContainerWidth: 768
    }
    
    var settings = $.extend( {}, defaults, options );
 
    return this.each(function() {
      console.log('creating instance');
      var myMenu = new Menu($(this), settings);
    });

  }

  this.Menu = function(container, settings) {
    /* Globals */
    this.settings = settings,
    
    this.$container = container,
    this.button = settings.button,
    this.$menuItems = this.$container.children(),
    this.selectedIndex = this.$menuItems.filter('.item-selected').index(),
    this.expandedItem = this.selectedIndex,
    /* Get dimensions */
    this.calculateItemSizes(),
    this.offsets = this.getOffsetsForExpanded(),
    this.primaryDimension = 'width',
    this.secondaryDimension = 'height',
    this.primaryAlignment = 'left',
    this.secondaryAlignment = 'right',
    this.isAnimated = false,
    this.$timer = $({
      progress: 0
    }),
    this.numRandoms = this.$menuItems.length,
    this.uniqueRandoms = [],
    this.updateStyle(),
    this.open = false,
    /* Start events */
    this.initEvents();
    this.initWindowResizeHandler();

  }
  Menu.prototype.getCollapsedItem = function() {
    return -1 === this.expandedItem ? [] : this.$menuItems.not(this.getExpandedItem()).get();
  };

  Menu.prototype.getExpandedItem = function() {
    return this.$menuItems[this.expandedItem] || null;
  };

  Menu.prototype.getContainerSize = function(bool) {
    return this.$container.outerWidth(bool);
  };
  
  Menu.prototype.calculateItemSizes = function() {
    var containerSize = this.getContainerSize(true),
      numItems = this.$menuItems.length;
    this.itemSize = containerSize / numItems;
    this.itemMaxSize = containerSize / 3 * 2;

    // Set max size
    if (numItems < 5) {
      this.itemMaxSize = containerSize / 3 * 2;
    } else {
      this.itemMaxSize = containerSize / 3;
    }
    // Using max set the min size 
    this.itemMinSize = (containerSize - this.itemMaxSize) / (numItems - 1);
  };

  Menu.prototype.expand = function(index) {
    var self = this,
      // used for expand-complete event later on
      oldIndex = this.expandedItem,
      oldExpanded = this.getExpandedItem();

    if (this.$container.width() < this.settings.minContainerWidth) {
      var $items = this.$menuItems;
      for (var i = $items.length; i--;) {
        this.setStyle($items[i], 'width:100%');
      }
      return;
    }

    if (index === -1) index = this.selectedIndex;

    if (index === this.expandedItem) return;

    $(this.getExpandedItem()).removeClass('menu-expanded');
    $(this.getCollapsedItem()).removeClass('menu-collapsed');
    this.expandedItem = index;
    $(this.getExpandedItem()).addClass('menu-expanded');
    $(this.getCollapsedItem()).addClass('menu-collapsed');

    // handle panel animation
    var $timer = this.$timer,
      numPanels = this.$menuItems.length,
      startOffsets = this.offsets.slice(),
      offsets = this.offsets,
      targetOffsets = this.getOffsetsForExpanded();

    $timer.stop()[0].progress = 0;
    this.isAnimated = true;
    $timer.animate({
      progress: 1
    }, {
      duration:  this.settings.duration,
      easing:  this.settings.easing,
      step: function(progress) {
        if (self._dirtyOffsets) {
          offsets = self.offsets;
          targetOffsets = self.getOffsetsForExpanded();
          self._dirtyOffsets = false;
        }
        offsets.length = 0;
        for (var i = 0; i < numPanels; i++) {
          var targetOffset = targetOffsets[i],
            newOffset = targetOffset - ((targetOffset - startOffsets[i]) * (1 - progress));
          offsets[i] = newOffset;
        }
        self.updateStyle();
      },
      complete: function() {
        self.isAnimated = false;
        self.$container.trigger('expand-complete.kwicks', {
          index: index,
          expanded: self.getExpandedItem(),
          collapsed: self.getCollapsedItem(),
          oldIndex: oldIndex,
          oldExpanded: oldExpanded,
          isAnimated: false
        });
      }
    });
  };

  Menu.prototype.getOffsetsForExpanded = function() {
    var expandedIndex = this.expandedItem,
      numItems = this.$menuItems.length,
      size = this.itemSize,
      minSize = this.itemMinSize,
      maxSize = this.itemMaxSize;

    //first panel is always offset by 0
    var offsets = [0];

    for (var i = 1; i < numItems; i++) {
      // no panel is expanded
      if (expandedIndex === -1) {
        offsets[i] = i * (size);
      }
      // this panel is before or is the expanded panel
      else if (i <= expandedIndex) {
        offsets[i] = i * (minSize);
      }
      // this panel is after the expanded panel
      else {
        offsets[i] = maxSize + (minSize * (i - 1)) + (i);
      }
    }
    return offsets;
  };

  Menu.prototype.updateStyle = function() {
    var offsets = this.offsets,
      $items = this.$menuItems,
      pDim = this.primaryDimension,
      pAlign = this.primaryAlignment,
      sAlign = this.secondaryAlignment,
      spacing = this.panelSpacing,
      containerSize = this.getContainerSize(true);

    var stylePrefix = !!this._stylesInited ? '' : 'position:absolute;',
      offset, size, prevOffset, style;
    // loop through remaining panels
    for (var i = $items.length; i--;) {
      prevOffset = offset;
      offset = Math.round(offsets[i]);
      if (i === $items.length - 1) {
        size = containerSize - offset;
        style = sAlign + ':0;' + pDim + ':' + size + 'px;';
      } else {
        size = prevOffset - offset;
        style = pAlign + ':' + offset + 'px;' + pDim + ':' + size + 'px;';
      }

      this.setStyle($items[i], stylePrefix + style);
    }

    if (!this._stylesInited) {
      this.$container.addClass('menu-processed');
      this._stylesInited = true;
    }
  };

  Menu.prototype.setStyle = (function() {
    if ($.support.style) {
      return function(el, style) {
        el.setAttribute('style', style);
      };
    } else {
      return function(el, style) {
        el.style.cssText = style;
      };
    }
  })();

  Menu.prototype.resize = function() {
    if (this.$container.width() > this.settings.minContainerWidth) {
      this.$container.removeClass('menu-horizontal');
      this.calculateItemSizes();
      this.offsets = this.getOffsetsForExpanded();

      if (this.isAnimated) {
        this._dirtyOffsets = true;
      } else {
        // otherwise update the styles immediately
        this.updateStyle();
      }
    } else {
      this.$container.addClass('menu-horizontal');
      var $items = this.$menuItems;
      for (var i = $items.length; i--;) {
        this.setStyle($items[i], 'width:100%;');
      }
    }
  };

  Menu.prototype.initWindowResizeHandler = function() {
    var self = this,
      prevTime = 0,
      execScheduled = false,
      $window = $(window);

    var onResize = function(e) {
      if (!e) {
        execScheduled = false;
      }
      var now = +new Date();
      if (now - prevTime < 20) {
        if (execScheduled) return;
        setTimeout(onResize, 20 - (now - prevTime));
        execScheduled = true;
        return;
      }
      prevTime = now;
      self.resize();
    };
    $window.on("resize", onResize);
  };

  Menu.prototype.randsort = function(c) {
    var o = new Array();
    for (var i = 0; i < c; i++) {
      var n = Math.floor(Math.random() * c);
      if (jQuery.inArray(n, o) > 0) --i;
      else o.push(n);
    }
    return o;
  };

  Menu.prototype.toggle = function() {
    // Hide menu items  
    var $container = this.$container,
      $items = this.$menuItems,
      self = this,
      randomIndex;
    $container.toggleClass('open');

    randomIndex = this.randsort($items.size());    
    $items.each(function(i) {
      var el = $(this);
      setTimeout(function() {
        if ($container.hasClass('open')) {
          el.addClass('active');
        } else {
          el.removeClass('active');
        }
      }, randomIndex[i] * 150);
    });
  }

  Menu.prototype.initEvents = function(config) {
    var self = this;

    $(this.button).on('click', function() {
      self.toggle();
      $(this).toggleClass('project-open');
    });
    $(this.$menuItems).on('mouseenter', function() {
      self.expand($(this).index());
    });
    
    $(this.$menuItems).on('click', function() {
      var el = $(this);      
    });
    
    $(this.$container).on('mouseleave', function() {
      self.expand(-1);
    });
    $(document).keyup(function(e) {
      if (e.keyCode == 27) {
        self.toggle();
        $(this).toggleClass('project-open');
      }
    });
  }
}(jQuery));
