// ==UserScript==
// @name           SG Joiner (SteamGifts)
// @namespace      eu.schepsen.sgj
// @version        0.1
// @description    SG Joiner helps you enter giveaways saving thousands of unnecessary clicks
// @author         nschepsen
// @match          https://*.steamgifts.com
// @match          https://*.steamgifts.com/giveaways/search*
// @grant          none
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// ==/UserScript==

'use strict'; var $ = window.$; var __MY_POINTS__ = parseInt($('.nav__points').text().match('\\d+'));

(function() {
    $('.giveaway__row-outer-wrap').each(function(giveaway) {

        var button = $('<div></div>', {
            'code': $(this).find('a').attr('href').split('/')[2],
            'class': 'sidebar__entry-insert',
            'text': 'Enter Giveaway',
            'style': 'font-weight: normal; padding: 18px 10px; margin: 0 15px 0 0; width: 120px;'
        });

        $(this).find('.giveaway__row-inner-wrap').prepend(button);

        var participants = $(this).find('.giveaway__links a:first').text().replace(',', '').match('\\d+');
        var copies = parseInt($(this).find('.giveaway__heading__thin:first').text().replace(',', '').match('\\d+ Copies')) || 1;

        var chance = copies * 100.0 * Math.pow(participants, -1);

        var chanceField = '<div><i class="fa fa-trophy"></i> WIN: ' + chance.toFixed(2) + '%</div>';

        $(this).find('.giveaway__columns').prepend(chanceField);
    });

    $('.giveaway_image_thumbnail').css('border-radius', '4px'); $('.giveaway_image_avatar').remove();

    updateView();

    $(".sidebar__entry-insert").click(function() {
        var self = $(this);
        $.ajax({
            dataType: "json",
            type: "POST",
            url: ajax_url,
            data: {
                'xsrf_token': $('input[name=xsrf_token]').val(),
                'do': 'entry_insert',
                'code': self.attr('code')
            }
        }).done(function(response) {
            self.parent().parent().remove();
        }).fail(function(xhr, status, error) {
            console.log(status + ': ' + error);
        }).always(function(data) { console.log(data);
            __MY_POINTS__ = parseInt(data.points); $('.nav__points').text(__MY_POINTS__); updateView();
        });
    });
})();

function updateView() {
    $('.giveaway__row-outer-wrap').each(function(giveaway) {
        if($(this).find('.is-faded').length){
            $(this).remove(); return;
        }
        var points = parseInt($(this).find('.giveaway__heading__thin').text().match('\\d+P'));
        var button = $(this).find('.sidebar__entry-insert');

        if(points >= __MY_POINTS__) {
            button.attr('class', 'sidebar__error');
            button.text('Not Enough'); button.prop('disabled', true);
        }
    });
    var pinned = $('.pinned-giveaways__outer-wrap');
    if(!pinned.find('.giveaway__row-outer-wrap').length) pinned.remove();
}
