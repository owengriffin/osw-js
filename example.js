function jid2id(jid) {
    return jid.match(/(.*)@.*/)[1];
}

var DOMAIN = "vagrant-ubuntu-lucid";

$(document).ready(function () {
    $('#connect').bind('click', function() {
	OSW.connect();
    });

    $('#register').bind('click', function() {
	var username, password, email_address;
	username = $('#register_username').attr('value');
	password = $('#register_password').attr('value');
	email_address = $('#register_email').attr('value');
	OSW.register(username, DOMAIN, password, email_address, function() {
	    console.info('Registration complete');
	    $('#registration').hide();
	}, function(code, message) {
	    $('#error').text('Registration failed: ' + code + ' - ' + message).fadeIn('show');
	});
    });
    $('#authenticate').bind('click', function () {
	OSW.authenticate($('#username')[0].value, DOMAIN, $('#password')[0].value);
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