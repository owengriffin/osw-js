function jid2id(jid) {
    var match = jid.match(/(.*)@.*/);
    if (match) {
	return match[1];
    }
    return '';
}

var DOMAIN = "vagrant-ubuntu-lucid";
var client = OneSocialWeb(
    {
	bosh_url: '/bosh', 
	callback: { 
	    contact: function(id, name) {
		$('#contactlist').append('<li id="' + jid2id(id) + '" class="unavailable"><em>' + id + '</em><br/>' + name + '<span class="subscription">?</span></li>'); 
	    },
	    activity: function(jid, activity) {
		$('#activitylist').append('<li><em>' + jid + '</em><br/>' + activity + '</li>');
	    },
	    presence: function(jid, show) {
		$('#' + jid2id(jid)).removeClass().addClass(show);
	    },
	    subscription: function(jid, type) {
		var element_jid = jid2id(jid);
		if (element_jid) {
		    $('#' + element_jid + ' span.subscription:first').html(type);
		}
	    }
	}
    });
$(document).ready(function () {
    $('#register').bind('click', function() {
     	var username, password, email_address;
     	username = $('#register_username').attr('value');
     	password = $('#register_password').attr('value');
     	email_address = $('#register_email').attr('value');
     	client.register(username, DOMAIN, password, email_address, function() {
     	    console.info('Registration complete');
     	    $('#registration').hide();
     	}, function(code, message) {
     	    $('#error').text('Registration failed: ' + code + ' - ' + message).fadeIn('show');
     	});
     });
    $('#authenticate').bind('click', function () {
     	client.authenticate($('#username')[0].value, DOMAIN, $('#password')[0].value);
    });
     $('#listactivities').bind('click', function() {
     	$('#activitylist').html('');
     	client.activities(function(actor, activity) {
     	    console.info('Activity : ' + actor + ' ' +  activity);
     	    $('#activitylist').append('<li><em>' + actor + '</em><br/>' + activity + '</li>');
     	});
     });
     $('#updatestatus').bind('click', function() {
     	client.status($('#status')[0].value);
     });
    $('#listcontacts').bind('click', function() {
     	client.contacts();
     });
    $('#listsubs').bind('click', function() {
	client.subscriptions();
    });
});