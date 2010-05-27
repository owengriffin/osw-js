function jid2id(jid) {
    return jid.match(/(.*)@.*/)[1];
}

$(document).ready(function () {
    $('#connect').bind('click', function () {
	OSW.connect($('#username')[0].value, $('#password')[0].value);
    });
    $('#listactivities').bind('click', function() {
	$('#activitylist').html('');
	OSW.activities(function(actor, activity) {
	    console.info('Activity : ' + actor + ' ' +  activity);
	    $('#activitylist').append('<li><em>' + actor + '</em><br/>' + activity + '</li>');
	});
    });
    $('#updatestatus').bind('click', function() {
	OSW.status($('#status')[0].value);
    });
    $('#listcontacts').bind('click', function() {

	OSW.contacts(function(id, name) { 	    
	    $('#contactlist').append('<li id="' + jid2id(id) + '" class="unavailable"><em>' + id + '</em><br/>' + name + '</li>'); 
	} );
    });
    OSW.callbacks.presence = function(jid, show) {
	$('#' + jid2id(jid)).removeClass().addClass(show);
    };
});