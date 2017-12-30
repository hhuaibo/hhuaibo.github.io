/*
 *  jQuery OwlCarousel v1.3.3
 *
 *  Copyright (c) 2013 Bartosz Wojciechowski
 *  http://www.owlgraphic.com/owlcarousel/
 *
 *  Licensed under MIT
 *
 */

/*JS Lint helpers: */
/*global dragMove: false, dragEnd: false, $, jQuery, alert, window, document */
/*jslint nomen: true, continue:true */

if (typeof Object.create !== "function") {
    Object.create = function (obj) {
        function F() {}
        F.prototype = obj;
        return new F();
    };
}
(function ($, window, document) {

    var Carousel = {
        init : function (options, el) {
            var base = this;

            base.$elem = $(el);
            base.options = $.extend({}, $.fn.owlCarousel.options, base.$elem.data(), options);

            base.userOptions = options;
            base.loadContent();
        },

        loadContent : function () {
            var base = this, url;

            function getData(data) {
                var i, content = "";
                if (typeof base.options.jsonSuccess === "function") {
                    base.options.jsonSuccess.apply(this, [data]);
                } else {
                    for (i in data.owl) {
                        if (data.owl.hasOwnProperty(i)) {
                            content += data.owl[i].item;
                        }
                    }
                    base.$elem.html(content);
                }
                base.logIn();
            }

            if (typeof base.options.beforeInit === "function") {
                base.options.beforeInit.apply(this, [base.$elem]);
            }

            if (typeof base.options.jsonPath === "string") {
                url = base.options.jsonPath;
                $.getJSON(url, getData);
            } else {
                base.logIn();
            }
        },

        logIn : function () {
            var base = this;

            base.$elem.data("owl-originalStyles", base.$elem.attr("style"));
            base.$elem.data("owl-originalClasses", base.$elem.attr("class"));

            base.$elem.css({opacity: 0});
            base.orignalItems = base.options.items;
            base.checkBrowser();
            base.wrapperWidth = 0;
            base.checkVisible = null;
            base.setVars();
        },

        setVars : function () {
            var base = this;
            if (base.$elem.children().length === 0) {return false; }
            base.baseClass();
            base.eventTypes();
            base.$userItems = base.$elem.children();
            base.itemsAmount = base.$userItems.length;
            base.wrapItems();
            base.$owlItems = base.$elem.find(".owl-item");
            base.$owlWrapper = base.$elem.find(".owl-wrapper");
            base.playDirection = "next";
            base.prevItem = 0;
            base.prevArr = [0];
            base.currentItem = 0;
            base.customEvents();
            base.onStartup();
        },

        onStartup : function () {
            var base = this;
            base.updateItems();
            base.calculateAll();
            base.buildControls();
            base.updateControls();
            base.response();
            base.moveEvents();
            base.stopOnHover();
            base.owlStatus();

            if (base.options.transitionStyle !== false) {
                base.transitionTypes(base.options.transitionStyle);
            }
            if (base.options.autoPlay === true) {
                base.options.autoPlay = 5000;
            }
            base.play();

            base.$elem.find(".owl-wrapper").css("display", "block");

            if (!base.$elem.is(":visible")) {
                base.watchVisibility();
            } else {
                base.$elem.css("opacity", 1);
            }
            base.onstartup = false;
            base.eachMoveUpdate();
            if (typeof base.options.afterInit === "function") {
                base.options.afterInit.apply(this, [base.$elem]);
            }
        },

        eachMoveUpdate : function () {
            var base = this;

            if (base.options.lazyLoad === true) {
                base.lazyLoad();
            }
            if (base.options.autoHeight === true) {
                base.autoHeight();
            }
            base.onVisibleItems();

            if (typeof base.options.afterAction === "function") {
                base.options.afterAction.apply(this, [base.$elem]);
            }
        },

        updateVars : function () {
            var base = this;
            if (typeof base.options.beforeUpdate === "function") {
                base.options.beforeUpdate.apply(this, [base.$elem]);
            }
            base.watchVisibility();
            base.updateItems();
            base.calculateAll();
            base.updatePosition();
            base.updateControls();
            base.eachMoveUpdate();
            if (typeof base.options.afterUpdate === "function") {
                base.options.afterUpdate.apply(this, [base.$elem]);
            }
        },

        reload : function () {
            var base = this;
            window.setTimeout(function () {
                base.updateVars();
            }, 0);
        },

        watchVisibility : function () {
            var base = this;

            if (base.$elem.is(":visible") === false) {
                base.$elem.css({opacity: 0});
                window.clearInterval(base.autoPlayInterval);
                window.clearInterval(base.checkVisible);
            } else {
                return false;
            }
            base.checkVisible = window.setInterval(function () {
                if (base.$elem.is(":visible")) {
                    base.reload();
                    base.$elem.animate({opacity: 1}, 200);
                    window.clearInterval(base.checkVisible);
                }
            }, 500);
        },

        wrapItems : function () {
            var base = this;
            base.$userItems.wrapAll("<div class="\"owl-wrapper\"">").wrap("<div class="\"owl-item\""></div>");
            base.$elem.find(".owl-wrapper").wrap("<div class="\"owl-wrapper-outer\"">");
            base.wrapperOuter = base.$elem.find(".owl-wrapper-outer");
            base.$elem.css("display", "block");
        },

        baseClass : function () {
            var base = this,
                hasBaseClass = base.$elem.hasClass(base.options.baseClass),
                hasThemeClass = base.$elem.hasClass(base.options.theme);

            if (!hasBaseClass) {
                base.$elem.addClass(base.options.baseClass);
            }

            if (!hasThemeClass) {
                base.$elem.addClass(base.options.theme);
            }
        },

        updateItems : function () {
            var base = this, width, i;

            if (base.options.responsive === false) {
                return false;
            }
            if (base.options.singleItem === true) {
                base.options.items = base.orignalItems = 1;
                base.options.itemsCustom = false;
                base.options.itemsDesktop = false;
                base.options.itemsDesktopSmall = false;
                base.options.itemsTablet = false;
                base.options.itemsTabletSmall = false;
                base.options.itemsMobile = false;
                return false;
            }

            width = $(base.options.responsiveBaseWidth).width();

            if (width > (base.options.itemsDesktop[0] || base.orignalItems)) {
                base.options.items = base.orignalItems;
            }
            if (base.options.itemsCustom !== false) {
                //Reorder array by screen size
                base.options.itemsCustom.sort(function (a, b) {return a[0] - b[0]; });

                for (i = 0; i < base.options.itemsCustom.length; i += 1) {
                    if (base.options.itemsCustom[i][0] <= width)="" {="" base.options.items="base.options.itemsCustom[i][1];" }="" else="" if="" (width="" <="base.options.itemsDesktop[0]" &&="" base.options.itemsdesktop="" !="=" false)="" base.options.itemsdesktopsmall="" base.options.itemstablet="" base.options.itemstabletsmall="" base.options.itemsmobile="" number="" of="" items="" is="" less="" than="" declared="" (base.options.items=""> base.itemsAmount && base.options.itemsScaleUp === true) {
                base.options.items = base.itemsAmount;
            }
        },

        response : function () {
            var base = this,
                smallDelay,
                lastWindowWidth;

            if (base.options.responsive !== true) {
                return false;
            }
            lastWindowWidth = $(window).width();

            base.resizer = function () {
                if ($(window).width() !== lastWindowWidth) {
                    if (base.options.autoPlay !== false) {
                        window.clearInterval(base.autoPlayInterval);
                    }
                    window.clearTimeout(smallDelay);
                    smallDelay = window.setTimeout(function () {
                        lastWindowWidth = $(window).width();
                        base.updateVars();
                    }, base.options.responsiveRefreshRate);
                }
            };
            $(window).resize(base.resizer);
        },

        updatePosition : function () {
            var base = this;
            base.jumpTo(base.currentItem);
            if (base.options.autoPlay !== false) {
                base.checkAp();
            }
        },

        appendItemsSizes : function () {
            var base = this,
                roundPages = 0,
                lastItem = base.itemsAmount - base.options.items;

            base.$owlItems.each(function (index) {
                var $this = $(this);
                $this
                    .css({"width": base.itemWidth})
                    .data("owl-item", Number(index));

                if (index % base.options.items === 0 || index === lastItem) {
                    if (!(index > lastItem)) {
                        roundPages += 1;
                    }
                }
                $this.data("owl-roundPages", roundPages);
            });
        },

        appendWrapperSizes : function () {
            var base = this,
                width = base.$owlItems.length * base.itemWidth;

            base.$owlWrapper.css({
                "width": width * 2,
                "left": 0
            });
            base.appendItemsSizes();
        },

        calculateAll : function () {
            var base = this;
            base.calculateWidth();
            base.appendWrapperSizes();
            base.loops();
            base.max();
        },

        calculateWidth : function () {
            var base = this;
            base.itemWidth = Math.round(base.$elem.width() / base.options.items);
        },

        max : function () {
            var base = this,
                maximum = ((base.itemsAmount * base.itemWidth) - base.options.items * base.itemWidth) * -1;
            if (base.options.items > base.itemsAmount) {
                base.maximumItem = 0;
                maximum = 0;
                base.maximumPixels = 0;
            } else {
                base.maximumItem = base.itemsAmount - base.options.items;
                base.maximumPixels = maximum;
            }
            return maximum;
        },

        min : function () {
            return 0;
        },

        loops : function () {
            var base = this,
                prev = 0,
                elWidth = 0,
                i,
                item,
                roundPageNum;

            base.positionsInArray = [0];
            base.pagesInArray = [];

            for (i = 0; i < base.itemsAmount; i += 1) {
                elWidth += base.itemWidth;
                base.positionsInArray.push(-elWidth);

                if (base.options.scrollPerPage === true) {
                    item = $(base.$owlItems[i]);
                    roundPageNum = item.data("owl-roundPages");
                    if (roundPageNum !== prev) {
                        base.pagesInArray[prev] = base.positionsInArray[i];
                        prev = roundPageNum;
                    }
                }
            }
        },

        buildControls : function () {
            var base = this;
            if (base.options.navigation === true || base.options.pagination === true) {
                base.owlControls = $("<div class="\"owl-controls\"/">").toggleClass("clickable", !base.browser.isTouch).appendTo(base.$elem);
            }
            if (base.options.pagination === true) {
                base.buildPagination();
            }
            if (base.options.navigation === true) {
                base.buildButtons();
            }
        },

        buildButtons : function () {
            var base = this,
                buttonsWrapper = $("<div class="\"owl-buttons\"/">");
            base.owlControls.append(buttonsWrapper);

            base.buttonPrev = $("<div>", {
                "class" : "owl-prev",
                "html" : base.options.navigationText[0] || ""
            });

            base.buttonNext = $("<div>", {
                "class" : "owl-next",
                "html" : base.options.navigationText[1] || ""
            });

            buttonsWrapper
                .append(base.buttonPrev)
                .append(base.buttonNext);

            buttonsWrapper.on("touchstart.owlControls mousedown.owlControls", "div[class^=\"owl\"]", function (event) {
                event.preventDefault();
            });

            buttonsWrapper.on("touchend.owlControls mouseup.owlControls", "div[class^=\"owl\"]", function (event) {
                event.preventDefault();
                if ($(this).hasClass("owl-next")) {
                    base.next();
                } else {
                    base.prev();
                }
            });
        },

        buildPagination : function () {
            var base = this;

            base.paginationWrapper = $("<div class="\"owl-pagination\"/">");
            base.owlControls.append(base.paginationWrapper);

            base.paginationWrapper.on("touchend.owlControls mouseup.owlControls", ".owl-page", function (event) {
                event.preventDefault();
                if (Number($(this).data("owl-page")) !== base.currentItem) {
                    base.goTo(Number($(this).data("owl-page")), true);
                }
            });
        },

        updatePagination : function () {
            var base = this,
                counter,
                lastPage,
                lastItem,
                i,
                paginationButton,
                paginationButtonInner;

            if (base.options.pagination === false) {
                return false;
            }

            base.paginationWrapper.html("");

            counter = 0;
            lastPage = base.itemsAmount - base.itemsAmount % base.options.items;

            for (i = 0; i < base.itemsAmount; i += 1) {
                if (i % base.options.items === 0) {
                    counter += 1;
                    if (lastPage === i) {
                        lastItem = base.itemsAmount - base.options.items;
                    }
                    paginationButton = $("<div>", {
                        "class" : "owl-page"
                    });
                    paginationButtonInner = $("<span></span>", {
                        "text": base.options.paginationNumbers === true ? counter : "",
                        "class": base.options.paginationNumbers === true ? "owl-numbers" : ""
                    });
                    paginationButton.append(paginationButtonInner);

                    paginationButton.data("owl-page", lastPage === i ? lastItem : i);
                    paginationButton.data("owl-roundPages", counter);

                    base.paginationWrapper.append(paginationButton);
                }
            }
            base.checkPagination();
        },
        checkPagination : function () {
            var base = this;
            if (base.options.pagination === false) {
                return false;
            }
            base.paginationWrapper.find(".owl-page").each(function () {
                if ($(this).data("owl-roundPages") === $(base.$owlItems[base.currentItem]).data("owl-roundPages")) {
                    base.paginationWrapper
                        .find(".owl-page")
                        .removeClass("active");
                    $(this).addClass("active");
                }
            });
        },

        checkNavigation : function () {
            var base = this;

            if (base.options.navigation === false) {
                return false;
            }
            if (base.options.rewindNav === false) {
                if (base.currentItem === 0 && base.maximumItem === 0) {
                    base.buttonPrev.addClass("disabled");
                    base.buttonNext.addClass("disabled");
                } else if (base.currentItem === 0 && base.maximumItem !== 0) {
                    base.buttonPrev.addClass("disabled");
                    base.buttonNext.removeClass("disabled");
                } else if (base.currentItem === base.maximumItem) {
                    base.buttonPrev.removeClass("disabled");
                    base.buttonNext.addClass("disabled");
                } else if (base.currentItem !== 0 && base.currentItem !== base.maximumItem) {
                    base.buttonPrev.removeClass("disabled");
                    base.buttonNext.removeClass("disabled");
                }
            }
        },

        updateControls : function () {
            var base = this;
            base.updatePagination();
            base.checkNavigation();
            if (base.owlControls) {
                if (base.options.items >= base.itemsAmount) {
                    base.owlControls.hide();
                } else {
                    base.owlControls.show();
                }
            }
        },

        destroyControls : function () {
            var base = this;
            if (base.owlControls) {
                base.owlControls.remove();
            }
        },

        next : function (speed) {
            var base = this;

            if (base.isTransition) {
                return false;
            }

            base.currentItem += base.options.scrollPerPage === true ? base.options.items : 1;
            if (base.currentItem > base.maximumItem + (base.options.scrollPerPage === true ? (base.options.items - 1) : 0)) {
                if (base.options.rewindNav === true) {
                    base.currentItem = 0;
                    speed = "rewind";
                } else {
                    base.currentItem = base.maximumItem;
                    return false;
                }
            }
            base.goTo(base.currentItem, speed);
        },

        prev : function (speed) {
            var base = this;

            if (base.isTransition) {
                return false;
            }

            if (base.options.scrollPerPage === true && base.currentItem > 0 && base.currentItem < base.options.items) {
                base.currentItem = 0;
            } else {
                base.currentItem -= base.options.scrollPerPage === true ? base.options.items : 1;
            }
            if (base.currentItem < 0) {
                if (base.options.rewindNav === true) {
                    base.currentItem = base.maximumItem;
                    speed = "rewind";
                } else {
                    base.currentItem = 0;
                    return false;
                }
            }
            base.goTo(base.currentItem, speed);
        },

        goTo : function (position, speed, drag) {
            var base = this,
                goToPixel;

            if (base.isTransition) {
                return false;
            }
            if (typeof base.options.beforeMove === "function") {
                base.options.beforeMove.apply(this, [base.$elem]);
            }
            if (position >= base.maximumItem) {
                position = base.maximumItem;
            } else if (position <= 1="" 0)="" {="" position="0;" }="" base.currentitem="base.owl.currentItem" =="" position;="" if="" (base.options.transitionstyle="" !="=" false="" &&="" drag="" "drag"="" base.options.items="==" base.browser.support3d="==" true)="" base.swapspeed(0);="" (base.browser.support3d="==" base.transition3d(base.positionsinarray[position]);="" else="" base.css2slide(base.positionsinarray[position],="" 1);="" base.aftergo();="" base.singleitemtransition();="" return="" false;="" gotopixel="base.positionsInArray[position];" base.iscss3finish="false;" (speed="==" base.swapspeed("paginationspeed");="" window.settimeout(function="" ()="" },="" base.options.paginationspeed);="" "rewind")="" base.swapspeed(base.options.rewindspeed);="" base.options.rewindspeed);="" base.swapspeed("slidespeed");="" base.options.slidespeed);="" base.transition3d(gotopixel);="" base.css2slide(gotopixel,="" jumpto="" :="" function="" (position)="" var="" base="this;" (typeof="" base.options.beforemove="==" "function")="" base.options.beforemove.apply(this,="" [base.$elem]);="" (position="">= base.maximumItem || position === -1) {
                position = base.maximumItem;
            } else if (position <= 0)="" {="" position="0;" }="" base.swapspeed(0);="" if="" (base.browser.support3d="==" true)="" base.transition3d(base.positionsinarray[position]);="" else="" base.css2slide(base.positionsinarray[position],="" 1);="" base.currentitem="base.owl.currentItem" =="" position;="" base.aftergo();="" },="" aftergo="" :="" function="" ()="" var="" base="this;" base.prevarr.push(base.currentitem);="" base.previtem="base.owl.prevItem" base.prevarr[base.prevarr.length="" -="" 2];="" base.prevarr.shift(0);="" (base.previtem="" !="=" base.currentitem)="" base.checkpagination();="" base.checknavigation();="" base.eachmoveupdate();="" (base.options.autoplay="" false)="" base.checkap();="" (typeof="" base.options.aftermove="==" "function"="" &&="" base.options.aftermove.apply(this,="" [base.$elem]);="" stop="" base.apstatus="stop" ;="" window.clearinterval(base.autoplayinterval);="" checkap="" (base.apstatus="" "stop")="" base.play();="" play="" return="" false;="" base.autoplayinterval="window.setInterval(function" base.next(true);="" base.options.autoplay);="" swapspeed="" (action)="" (action="==" "slidespeed")="" base.$owlwrapper.css(base.addcssspeed(base.options.slidespeed));="" "paginationspeed")="" base.$owlwrapper.css(base.addcssspeed(base.options.paginationspeed));="" action="" "string")="" base.$owlwrapper.css(base.addcssspeed(action));="" addcssspeed="" (speed)="" "-webkit-transition":="" "all="" "="" +="" speed="" "ms="" ease",="" "-moz-transition":="" "-o-transition":="" "transition":="" ease"="" };="" removetransition="" "",="" ""="" dotranslate="" (pixels)="" "-webkit-transform":="" "translate3d("="" pixels="" "px,="" 0px,="" 0px)",="" "-moz-transform":="" "-o-transform":="" "-ms-transform":="" "transform":="" 0px,0px)"="" transition3d="" (value)="" base.$owlwrapper.css(base.dotranslate(value));="" css2move="" base.$owlwrapper.css({"left"="" value});="" css2slide="" (value,="" speed)="" base.iscssfinish="false;" base.$owlwrapper.stop(true,="" true).animate({="" "left"="" value="" duration="" ||="" base.options.slidespeed,="" complete="" });="" checkbrowser="" translate3d="translate3d(0px, 0px, 0px)" ,="" tempelem="document.createElement("div")," regex,="" assupport,="" support3d,="" istouch;="" tempelem.style.csstext="  -moz-transform:" ";="" -ms-transform:"="" -o-transform:"="" -webkit-transform:"="" transform:"="" translate3d;="" regex="/translate3d\(0px," 0px\)="" g;="" assupport="tempElem.style.cssText.match(regex);" support3d="(asSupport" null="" assupport.length="==" istouch="ontouchstart" in="" window="" window.navigator.msmaxtouchpoints;="" base.browser="{" "support3d"="" "istouch"="" moveevents="" (base.options.mousedrag="" false="" base.options.touchdrag="" base.gestures();="" base.disabledevents();="" eventtypes="" types="["s"," "e",="" "x"];="" base.ev_types="{};" true="" "touchstart.owl="" mousedown.owl",="" "touchmove.owl="" mousemove.owl",="" "touchend.owl="" touchcancel.owl="" mouseup.owl"="" ];="" "touchstart.owl",="" "touchmove.owl",="" touchcancel.owl"="" "mousedown.owl",="" "mousemove.owl",="" "mouseup.owl"="" base.ev_types.start="types[0];" base.ev_types.move="types[1];" base.ev_types.end="types[2];" disabledevents="" base.$elem.on("dragstart.owl",="" (event)="" event.preventdefault();="" base.$elem.on("mousedown.disabletextselect",="" (e)="" $(e.target).is('input,="" textarea,="" select,="" option');="" gestures="" *jslint="" unparam:="" true*="" locals="{" offsetx="" 0,="" offsety="" baseelwidth="" relativepos="" position:="" null,="" minswipe="" maxswipe:="" sliding="" dargging:="" targetelement="" gettouches(event)="" (event.touches="" undefined)="" x="" event.touches[0].pagex,="" y="" event.touches[0].pagey="" (event.pagex="" event.pagex,="" event.pagey="" event.clientx,="" event.clienty="" swapevents(type)="" (type="==" "on")="" $(document).on(base.ev_types.move,="" dragmove);="" $(document).on(base.ev_types.end,="" dragend);="" "off")="" $(document).off(base.ev_types.move);="" $(document).off(base.ev_types.end);="" dragstart(event)="" ev="event.originalEvent" event="" window.event,="" (ev.which="==" 3)="" (base.itemsamount="" <="base.options.items)" return;="" (base.iscssfinish="==" !base.options.dragbeforeanimfinish)="" (base.iscss3finish="==" (base.browser.istouch="" !base.$owlwrapper.hasclass("grabbing"))="" base.$owlwrapper.addclass("grabbing");="" base.newposx="0;" base.newrelativex="0;" $(this).css(base.removetransition());="" locals.relativepos="position.left;" locals.offsetx="getTouches(ev).x" position.left;="" locals.offsety="getTouches(ev).y" position.top;="" swapevents("on");="" locals.sliding="false;" locals.targetelement="ev.target" ev.srcelement;="" dragmove(event)="" minswipe,="" maxswipe;="" locals.offsetx;="" base.newposy="getTouches(ev).y" locals.offsety;="" locals.relativepos;="" base.options.startdragging="==" locals.dragging="" base.options.startdragging.apply(base,="" ((base.newrelativex=""> 8 || base.newRelativeX < -8) && (base.browser.isTouch === true)) {
                    if (ev.preventDefault !== undefined) {
                        ev.preventDefault();
                    } else {
                        ev.returnValue = false;
                    }
                    locals.sliding = true;
                }

                if ((base.newPosY > 10 || base.newPosY < -10) && locals.sliding === false) {
                    $(document).off("touchmove.owl");
                }

                minSwipe = function () {
                    return base.newRelativeX / 5;
                };

                maxSwipe = function () {
                    return base.maximumPixels + base.newRelativeX / 5;
                };

                base.newPosX = Math.max(Math.min(base.newPosX, minSwipe()), maxSwipe());
                if (base.browser.support3d === true) {
                    base.transition3d(base.newPosX);
                } else {
                    base.css2move(base.newPosX);
                }
            }

            function dragEnd(event) {
                var ev = event.originalEvent || event || window.event,
                    newPosition,
                    handlers,
                    owlStopEvent;

                ev.target = ev.target || ev.srcElement;

                locals.dragging = false;

                if (base.browser.isTouch !== true) {
                    base.$owlWrapper.removeClass("grabbing");
                }

                if (base.newRelativeX < 0) {
                    base.dragDirection = base.owl.dragDirection = "left";
                } else {
                    base.dragDirection = base.owl.dragDirection = "right";
                }

                if (base.newRelativeX !== 0) {
                    newPosition = base.getNewPosition();
                    base.goTo(newPosition, false, "drag");
                    if (locals.targetElement === ev.target && base.browser.isTouch !== true) {
                        $(ev.target).on("click.disable", function (ev) {
                            ev.stopImmediatePropagation();
                            ev.stopPropagation();
                            ev.preventDefault();
                            $(ev.target).off("click.disable");
                        });
                        handlers = $._data(ev.target, "events").click;
                        owlStopEvent = handlers.pop();
                        handlers.splice(0, 0, owlStopEvent);
                    }
                }
                swapEvents("off");
            }
            base.$elem.on(base.ev_types.start, ".owl-wrapper", dragStart);
        },

        getNewPosition : function () {
            var base = this,
                newPosition = base.closestItem();

            if (newPosition > base.maximumItem) {
                base.currentItem = base.maximumItem;
                newPosition  = base.maximumItem;
            } else if (base.newPosX >= 0) {
                newPosition = 0;
                base.currentItem = 0;
            }
            return newPosition;
        },
        closestItem : function () {
            var base = this,
                array = base.options.scrollPerPage === true ? base.pagesInArray : base.positionsInArray,
                goal = base.newPosX,
                closest = null;

            $.each(array, function (i, v) {
                if (goal - (base.itemWidth / 20) > array[i + 1] && goal - (base.itemWidth / 20) < v && base.moveDirection() === "left") {
                    closest = v;
                    if (base.options.scrollPerPage === true) {
                        base.currentItem = $.inArray(closest, base.positionsInArray);
                    } else {
                        base.currentItem = i;
                    }
                } else if (goal + (base.itemWidth / 20) < v && goal + (base.itemWidth / 20) > (array[i + 1] || array[i] - base.itemWidth) && base.moveDirection() === "right") {
                    if (base.options.scrollPerPage === true) {
                        closest = array[i + 1] || array[array.length - 1];
                        base.currentItem = $.inArray(closest, base.positionsInArray);
                    } else {
                        closest = array[i + 1];
                        base.currentItem = i + 1;
                    }
                }
            });
            return base.currentItem;
        },

        moveDirection : function () {
            var base = this,
                direction;
            if (base.newRelativeX < 0) {
                direction = "right";
                base.playDirection = "next";
            } else {
                direction = "left";
                base.playDirection = "prev";
            }
            return direction;
        },

        customEvents : function () {
            /*jslint unparam: true*/
            var base = this;
            base.$elem.on("owl.next", function () {
                base.next();
            });
            base.$elem.on("owl.prev", function () {
                base.prev();
            });
            base.$elem.on("owl.play", function (event, speed) {
                base.options.autoPlay = speed;
                base.play();
                base.hoverStatus = "play";
            });
            base.$elem.on("owl.stop", function () {
                base.stop();
                base.hoverStatus = "stop";
            });
            base.$elem.on("owl.goTo", function (event, item) {
                base.goTo(item);
            });
            base.$elem.on("owl.jumpTo", function (event, item) {
                base.jumpTo(item);
            });
        },

        stopOnHover : function () {
            var base = this;
            if (base.options.stopOnHover === true && base.browser.isTouch !== true && base.options.autoPlay !== false) {
                base.$elem.on("mouseover", function () {
                    base.stop();
                });
                base.$elem.on("mouseout", function () {
                    if (base.hoverStatus !== "stop") {
                        base.play();
                    }
                });
            }
        },

        lazyLoad : function () {
            var base = this,
                i,
                $item,
                itemNumber,
                $lazyImg,
                follow;

            if (base.options.lazyLoad === false) {
                return false;
            }
            for (i = 0; i < base.itemsAmount; i += 1) {
                $item = $(base.$owlItems[i]);

                if ($item.data("owl-loaded") === "loaded") {
                    continue;
                }

                itemNumber = $item.data("owl-item");
                $lazyImg = $item.find(".lazyOwl");

                if (typeof $lazyImg.data("src") !== "string") {
                    $item.data("owl-loaded", "loaded");
                    continue;
                }
                if ($item.data("owl-loaded") === undefined) {
                    $lazyImg.hide();
                    $item.addClass("loading").data("owl-loaded", "checked");
                }
                if (base.options.lazyFollow === true) {
                    follow = itemNumber >= base.currentItem;
                } else {
                    follow = true;
                }
                if (follow && itemNumber < base.currentItem + base.options.items && $lazyImg.length) {
                    base.lazyPreload($item, $lazyImg);
                }
            }
        },

        lazyPreload : function ($item, $lazyImg) {
            var base = this,
                iterations = 0,
                isBackgroundImg;

            if ($lazyImg.prop("tagName") === "DIV") {
                $lazyImg.css("background-image", "url(" + $lazyImg.data("src") + ")");
                isBackgroundImg = true;
            } else {
                $lazyImg[0].src = $lazyImg.data("src");
            }

            function showImage() {
                $item.data("owl-loaded", "loaded").removeClass("loading");
                $lazyImg.removeAttr("data-src");
                if (base.options.lazyEffect === "fade") {
                    $lazyImg.fadeIn(400);
                } else {
                    $lazyImg.show();
                }
                if (typeof base.options.afterLazyLoad === "function") {
                    base.options.afterLazyLoad.apply(this, [base.$elem]);
                }
            }

            function checkLazyImage() {
                iterations += 1;
                if (base.completeImg($lazyImg.get(0)) || isBackgroundImg === true) {
                    showImage();
                } else if (iterations <= 10="" 100)="" {="" if="" image="" loads="" in="" less="" than="" seconds="" window.settimeout(checklazyimage,="" 100);="" }="" else="" showimage();="" checklazyimage();="" },="" autoheight="" :="" function="" ()="" var="" base="this," $currentimg="$(base.$owlItems[base.currentItem]).find("img")," iterations;="" addheight()="" $currentitem="$(base.$owlItems[base.currentItem]).height();" base.wrapperouter.css("height",="" +="" "px");="" (!base.wrapperouter.hasclass("autoheight"))="" window.settimeout(function="" base.wrapperouter.addclass("autoheight");="" 0);="" checkimage()="" iterations="" (base.completeimg($currentimg.get(0)))="" addheight();="" (iterations="" <="100)" window.settimeout(checkimage,="" "");="" remove="" height="" attribute="" ($currentimg.get(0)="" !="=" undefined)="" checkimage();="" completeimg="" (img)="" naturalwidthtype;="" (!img.complete)="" return="" false;="" naturalwidthtype="typeof" img.naturalwidth;="" (naturalwidthtype="" "undefined"="" &&="" img.naturalwidth="==" 0)="" true;="" onvisibleitems="" i;="" (base.options.addclassactive="==" true)="" base.$owlitems.removeclass("active");="" base.visibleitems="[];" for="" (i="base.currentItem;" i="" base.currentitem="" base.options.items;="" base.visibleitems.push(i);="" $(base.$owlitems[i]).addclass("active");="" base.owl.visibleitems="base.visibleItems;" transitiontypes="" (classname)="" currently="" available:="" "fade",="" "backslide",="" "godown",="" "fadeup"="" base.outclass="owl-" classname="" "-out";="" base.inclass="owl-" "-in";="" singleitemtransition="" outclass="base.outClass," inclass="base.inClass," $previtem="base.$owlItems.eq(base.prevItem)," prevpos="Math.abs(base.positionsInArray[base.currentItem])" base.positionsinarray[base.previtem],="" origin="Math.abs(base.positionsInArray[base.currentItem])" base.itemwidth="" 2,="" animend="webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend" ;="" base.istransition="true;" base.$owlwrapper="" .addclass('owl-origin')="" .css({="" "-webkit-transform-origin"="" "px",="" "-moz-perspective-origin"="" "perspective-origin"="" "px"="" });="" transstyles(prevpos)="" "position"="" "relative",="" "left"="" };="" .css(transstyles(prevpos,="" 10))="" .addclass(outclass)="" .on(animend,="" base.endprev="true;" $previtem.off(animend);="" base.cleartransstyle($previtem,="" outclass);="" .addclass(inclass)="" base.endcurrent="true;" $currentitem.off(animend);="" base.cleartransstyle($currentitem,="" inclass);="" cleartransstyle="" (item,="" classtoremove)="" item.css({="" "",="" ""="" }).removeclass(classtoremove);="" (base.endprev="" base.endcurrent)="" base.$owlwrapper.removeclass('owl-origin');="" owlstatus="" base.owl="{" "useroptions"="" base.useroptions,="" "baseelement"="" base.$elem,="" "useritems"="" base.$useritems,="" "owlitems"="" base.$owlitems,="" "currentitem"="" base.currentitem,="" "previtem"="" base.previtem,="" "visibleitems"="" base.visibleitems,="" "istouch"="" base.browser.istouch,="" "browser"="" base.browser,="" "dragdirection"="" base.dragdirection="" clearevents="" base.$elem.off(".owl="" owl="" mousedown.disabletextselect");="" $(document).off(".owl="" owl");="" $(window).off("resize",="" base.resizer);="" unwrap="" (base.$elem.children().length="" base.$owlwrapper.unwrap();="" base.$useritems.unwrap().unwrap();="" (base.owlcontrols)="" base.owlcontrols.remove();="" base.clearevents();="" base.$elem="" .attr("style",="" base.$elem.data("owl-originalstyles")="" ||="" "")="" .attr("class",="" base.$elem.data("owl-originalclasses"));="" destroy="" base.stop();="" window.clearinterval(base.checkvisible);="" base.unwrap();="" base.$elem.removedata();="" reinit="" (newoptions)="" options="$.extend({}," newoptions);="" base.init(options,="" base.$elem);="" additem="" (htmlstring,="" targetposition)="" position;="" (!htmlstring)="" {return="" base.$elem.append(htmlstring);="" base.setvars();="" (targetposition="==" undefined="" targetposition="==" -1)="" position="-1;" (position="">= base.$userItems.length || position === -1) {
                base.$userItems.eq(-1).after(htmlString);
            } else {
                base.$userItems.eq(position).before(htmlString);
            }

            base.setVars();
        },

        removeItem : function (targetPosition) {
            var base = this,
                position;

            if (base.$elem.children().length === 0) {
                return false;
            }
            if (targetPosition === undefined || targetPosition === -1) {
                position = -1;
            } else {
                position = targetPosition;
            }

            base.unWrap();
            base.$userItems.eq(position).remove();
            base.setVars();
        }

    };

    $.fn.owlCarousel = function (options) {
        return this.each(function () {
            if ($(this).data("owl-init") === true) {
                return false;
            }
            $(this).data("owl-init", true);
            var carousel = Object.create(Carousel);
            carousel.init(options, this);
            $.data(this, "owlCarousel", carousel);
        });
    };

    $.fn.owlCarousel.options = {

        items : 5,
        itemsCustom : false,
        itemsDesktop : [1199, 4],
        itemsDesktopSmall : [979, 3],
        itemsTablet : [768, 2],
        itemsTabletSmall : false,
        itemsMobile : [479, 1],
        singleItem : false,
        itemsScaleUp : false,

        slideSpeed : 200,
        paginationSpeed : 800,
        rewindSpeed : 1000,

        autoPlay : false,
        stopOnHover : false,

        navigation : false,
        navigationText : ["prev", "next"],
        rewindNav : true,
        scrollPerPage : false,

        pagination : true,
        paginationNumbers : false,

        responsive : true,
        responsiveRefreshRate : 200,
        responsiveBaseWidth : window,

        baseClass : "owl-carousel",
        theme : "owl-theme",

        lazyLoad : false,
        lazyFollow : true,
        lazyEffect : "fade",

        autoHeight : false,

        jsonPath : false,
        jsonSuccess : false,

        dragBeforeAnimFinish : true,
        mouseDrag : true,
        touchDrag : true,

        addClassActive : false,
        transitionStyle : false,

        beforeUpdate : false,
        afterUpdate : false,
        beforeInit : false,
        afterInit : false,
        beforeMove : false,
        afterMove : false,
        afterAction : false,
        startDragging : false,
        afterLazyLoad: false
    };
}(jQuery, window, document));</=></=></=></div></div></div></div></div></div></=></div></div>