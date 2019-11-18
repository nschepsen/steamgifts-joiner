// ==UserScript==
// @name           SteamGifts!JOINER
// @namespace      eu.schepsen.sgj
// @version        0.2.1
// @description    SteamGifts!JOINER helps you enter giveaways saving thousands of unnecessary clicks
// @author         nschepsen
// @match          https://*.steamgifts.com
// @match          https://*.steamgifts.com/giveaways/search*
// @match          https://*.steamgifts.com/giveaways/won*
// @grant          GM_getValue
// @grant          GM_setValue
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// ==/UserScript==

'use strict'; var $ = window.$; var version = '0.2.1'

function match(regex, el, callback = value => value) {
    return callback(el.text().replace(',', '').match(regex));
}

/* Settings */

// Hide all entered Giveaways
var hideGiveaways = GM_getValue('hideGiveaways', false);
// Enum represents the .btn css class toggling/syncing (@see buttonToggle())
const mode = { 'SYNC': 1, 'TOGGLE': 2 };
// SteamGifts Points
var __MY_POINTS__ = match('\\d+', $('.nav__points'), parseInt);

/* Buttons Classes */

const DATA = [ {
        'class': 'sidebar__entry-insert',
        'do': 'entry_insert',
        'text': 'Enter Giveaway'
    }, {
        'text': 'Not Enough',
        'do': 'noop',
        'class': 'sidebar__error'
    }, {
        'class': 'sidebar__entry-delete',
        'do': 'entry_delete', 'text': 'Remove Entry'
    },
];

function requiredPoints(el) {

    return match('\\d+P', el.find('.giveaway__heading__thin'), parseInt);
}

function isFaded(el) {

    return el.find('.is-faded').length > 0;
}

function toggleButton(btn, phase = mode.SYNC) {

    var next = ((type = getGiveawayType(btn)) + phase) % (phase << 1);

    if(phase === mode.SYNC) [type, next] = [next, type];

    btn.addClass(DATA[next].class);
    btn.text(DATA[next].text);
    btn.removeClass(DATA[type].class);

    if(next === 2)

        btn.parent().addClass('is-faded');

    if(type === 2 && next === 0) btn.parent().removeClass('is-faded');
}

function getGiveawayType(el) {

    if(el.hasClass('btn')) {
        el = el.parent().parent();
    }
    return isFaded(el) ? 2 : requiredPoints(el) <= __MY_POINTS__ ? 0 : 1;
}

function updateView() {
    $('.giveaway__row-outer-wrap').each(function(i, scope) {
        if(!$(this).find('.btn').length) {
            var copies = match('\\d+ Copies', $(this).find('.giveaway__heading__thin:first'), value => value === null ? 1 : parseInt(value));
            var participants = match('\\d+', $(this).find('.giveaway__links a:first'));
            var chance = 100 * copies * Math.pow(participants, -1);
            var winChanceField = '<div><i class="fa fa-trophy"></i> WIN: '+ chance.toFixed(2) +'%</div>';
            $(this).find('.giveaway__columns').prepend(winChanceField);
/* Create a button and prepend it to Giveaway's Inner Wrap */
            var button = $('<div></div>', {
                'code': $(this).find('a').attr('href').split('/')[2],
                'class': 'btn ' + DATA[getGiveawayType($(this))].class,
                'text': DATA[getGiveawayType($(this))].text,
                'style': 'font-weight: normal; padding: 18px 10px; margin: 0 15px 0 0; width: 120px;'
            });
            $(this).find('.giveaway__row-inner-wrap').prepend(button);
        }
        if(isFaded($(this)) && hideGiveaways) { $(this).hide(); return; } /* Check if we have to hide a Giveaway */
        if(!hideGiveaways && $(this).is(':hidden'))
            $(this).show();
/* Check if we have to sync button classes */
        if(!(button = $(this).find('.btn')).hasClass(DATA[type = getGiveawayType($(this))].class)) toggleButton(button, mode.SYNC);
    });

    if(!$('.giveaway__row-outer-wrap:visible').length) $('.pagination').hide();

    $('.giveaway_image_thumbnail').css('border-radius', '4px');
    $('.giveaway_image_avatar').remove();

    if(!(pinned = $('.pinned-giveaways__outer-wrap')).find('.giveaway__row-outer-wrap').length) pinned.remove();
}

function createView() {

    var menu = $('<div class="sgj"><label for="hideGAs"><input id="hideGAs" type="checkbox"/>Hide joined Giveaways</label></div>');

/* Remove unnecessary DOM elements & ads */

    $('.featured__container').remove();
    $('.sidebar__mpu').remove();
    $('.giveaway_image_avatar').remove();

/* Add SteamGifts!JOINER menubar */

    $('.nav__right-container').prepend(menu);

    $('.sgj').css('padding', '0 25px');
    $('.sgj').css('color', 'white');
    $('.sgj input').css('margin', '0 5px');
    $('.sgj input').css('width', '15px');
    $('.sgj input').css('vertical-align', 'middle'); $('.sgj label').css('vertical-align', 'middle');

    $('#hideGAs').prop('checked', hideGiveaways);

    $('.pagination__results').css('font-family', 'Open Sans');
    $('.pagination__results').css('font-size', '12px');
    $('.pagination__results').css('font-style', 'normal');
    $('.pagination__results').html('https://github.com/nschepsen/steamgifts-joiner: <strong>SteamGifts!JOINER v'+ version +'</strong>');

/* Beautify Pinned Giveaways Decorations */

    $('.page__heading').css('text-transform', 'uppercase');
    $('.pinned-giveaways__button').click();
    $('.pinned-giveaways__inner-wrap').removeClass();

    $('.pinned-giveaways__outer-wrap').find('.giveaway__row-outer-wrap:visible').css('border-bottom', '0')

/* Others (no avatar, rounded icons, etc.) */

    $('.giveaway_image_thumbnail').css('border-radius', '4px');
    $('.page__outer-wrap').css('padding-top', '70px');
    $('.pagination').parent().children().slice(4).remove();
    $('.giveaway__row-outer-wrap').parent().addClass('giveaways');

/* Let keep the header static, always on TOP while scrolling */

    $('header').css('padding', '10px 0');
    $('header').css('position', 'fixed');
    $('header').css('width', '100%'); $('header').css('z-index', '10');

/* Handle Say-Thank-You Function (Add a Comment) */

    $('.table__row-inner-wrap').each(function(i, scope) {
        var thankYou = $('<div></div>', {
            'href': $(this).find('a').attr('href'),
            'text': 'Add a Comment',
            'class': 'sidebar__entry-insert thanks',
            'style': 'font-size: 12px; font-weight: normal; margin-bottom: 0;'
        });
        $(this).find('div').first().html(thankYou);

        $(this).find('div').first().after(
                $('<div><input name="comment" value="Thank You!" style="text-align: center;"/></div>')
            );
    });
    $('.table__column__key__redeem').remove();

    $('.table__row-inner-wrap').on('click', '.thanks', function() {
        $.post($(this).attr('href'), {
            'do': 'comment_new',
            'parent_id': '',
            'description': comment = $(this).parent().parent().find('input[name="comment"]').val(),
            'xsrf_token': $('input[name="xsrf_token"]').val(),
        }, function(data, status) {
            alert('Comment: ' + comment + ' (' + status.toUpperCase() +')'); });
    });
}

(function() { createView(); updateView();

/* Handler: Turn On-Off the hideGiveaways Option */

    $('#hideGAs').on('click', function() {
        GM_setValue('hideGiveaways', hideGiveaways = $(this).is(':checked')); updateView();
    });

/* Handler: Let sctoll the page to Infinity */

    $(window).scroll(function () {
        if($(document).height() - $(this).height() == $(this).scrollTop()) {
            var wrap = '.giveaway__row-outer-wrap';
            var pagination = '.pagination__navigation';
            var href = $('a.is-selected').next().attr('href');

            if(typeof(href) === 'undefined') return;

            $.get(href, function(response) {
                $(wrap).parent().last().append(
                    $(response).find(wrap).slice(-50)
                    );
                $(pagination).html($(response).find(pagination)); updateView();
            });
        }
    });

/* Handler: Toggle button (use mode.TOGGLE to switch to the next class) */

    $('.giveaways').on('click', '.btn', function() { var self = $(this);
        if((type = getGiveawayType($(this))) !== 1) {
            $.ajax({
                dataType: 'json',
                type: 'POST',
                url: ajax_url,
                data: {
                    'do': DATA[getGiveawayType($(this))].do,
                    'code': $(this).attr('code'),
                    'xsrf_token': $('input[name=xsrf_token]').val(),
                }
            }).done(function(response) { toggleButton(self, mode.TOGGLE);
            }).fail(function(response, status, xhr) {

                console.log(msg + xhr.status + ' ' + xhr.statusText);

            }).always(function(data) { console.log(data);
                __MY_POINTS__ = parseInt(data.points); $('.nav__points').text(__MY_POINTS__); updateView();
            });
        }
    });
})();
