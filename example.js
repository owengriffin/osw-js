var ExampleOSWClient = function() {
    var that, client, contacts;
    // Private methods
    var build_contact_list, get_contact;

    // A list of {jid: '', element_id: '', status: '', groups: []}
    contacts = [];

    get_contact = function(jid) {
	var index, node, contact;

	jid = Strophe.getNodeFromJid(jid) + '@' + Strophe.getDomainFromJid(jid) ;

	if (contacts.length > 0) {
	    for (index = 0; index < contacts.length; index ++) {
		if (contacts[index].jid === jid) {
		    return contacts[index];
		}
	    }
	}
	contact = {'jid': jid};
	contacts.push(contact);
	return contact;
    };

    build_contact_list = function() {
	var index, contact, element, group;
	var get_group_element = function(group_name) {
	    var group_id, group_element;
	    group_id = 'grp_' + group_name.toLowerCase().replace(/ /, '');
	    group_element = $('#' + group_id);
	    if (group_element === null || group_element.length === 0) {
		group_element = $(document.createElement('ul'));
		group_element.attr('id', group_id);
		group_element.append('<li class="name">' + group_name + '</li>');
		$('#contactlist').append(group_element);
	    }
	    return group_element;
	};
	if (contacts.length > 0) {
	    for (index = 0; index < contacts.length; index ++) {
		contact = contacts[index];

		// Create a list for the group, if it does not exist
		group = 'Others';
		if (typeof(contact.groups) !== 'undefined' && contact.groups.length !== 0) {
		    group = contact.groups[0];
		}
		group_element = get_group_element(group);
		
		if (typeof(contact.element_id) === 'undefined' || contact.element_id === "") {
		    contact.element_id =  Strophe.getNodeFromJid(contact.jid) + '_' +  Strophe.getDomainFromJid(contact.jid);
		    group_element.append('<li id="' + contact.element_id + '" class="' + contact.status + '"><img src="" class="avatar"/><span class="nickname">' + contact.jid + '</span></li>');
		} else {
		    element = $('#' + contact.element_id);
		    element.removeClass();
		    element.addClass(contact.status);
		    if (typeof(contact.nickname) === 'undefined' ||
			contact.nickname === '') {
			element.children('.nickname').text(contact.jid);
		    } else {
			element.children('.nickname').text(contact.nickname);
		    }

		    if (typeof(contact.avatar) === 'undefined' ||
			contact.avatar === '') {
		    } else {
			element.children('.avatar').attr('src', 'data:image/png;base64,' + contact.avatar);
		    }

		    // Check that the group of the contact hasn't changed
		    if (element.parent() !== group_element) {
			console.debug(element);
			element.remove();
			group_element.append(element);
		    } 
		}   
		element = $('#' + contact.element_id);
		(function() {
		    var subscription_element = element.children('.subscription');
		    if (subscription_element === null || subscription_element.length === 0) {
			subscription_element = $(document.createElement('span'));
			subscription_element.addClass('subscription');
			subscription_element.text('[unknown]');
			subscription_element.bind('click', function() {
			    var status = $(this).html();
			    if (status === '[follow]') {
				client.follow(contact.jid, function() {
				    contact.subscription = 'unsubscribe';
				    subscription_element.text('[unfollow]');
				});
			    } else if (status === '[unfollow]') {
				client.unfollow(contact.jid, function() {
				    contact.subscription = 'subscribe';
				    subscription_element.text('[follow]');
				});
			    }
			});
			element.append(subscription_element);
		    } else {
			$(subscription_element[0]).html('[' + (contact.subscription == 'subscribed' ? 'unfollow' : 'follow') + ']');
		    }
		})();
	    }
	}
    };

    client = OneSocialWeb({
	bosh_url: '/bosh', 
	callback: { 
	    connected: function() {
     		$('#unauthenticated').hide();
		$('#authenticated').show();
		client.contacts();
		client.inbox();
		client.subscriptions();
	    },
	    contact: function(id, name, groups) {
		var contact;
		console.info('Received contact: ' + id + ' ' + name);
		contact = get_contact(id);
		contact.name = name;
		contact.groups = groups;
		build_contact_list();
	    },
	    activity: function(jid, activity) {
		$('#activitylist').append('<li><em>' + jid + '</em><br/>' + activity + '</li>');
	    },
	    presence: function(jid, show) {
		get_contact(jid).status = show;
		build_contact_list();
	    },
	    subscription: function(jid, type) {
		console.info("Receieved subscription " + jid + " " + type);
		get_contact(jid).subscription = type;
		build_contact_list();
	    },
	    presence_subscription_request: function(jid) {
		var button = $(document.createElement('input'));
		button.attr('type', 'button');
		button.attr('value', 'Accept');
		$('#status').text('You have received a presence subscription from: ' + jid);
		$('#status').append(button);
		button.bind('click', function() {
		    client.confirm_contact(jid);
		    $('#status').html('');
		});
	    },
	    message: function(to, from, type, text) {
		$('#messages').prepend('<p>@' + from + ': ' + text + '</p>');
	    },
	    nickname: function(jid, nickname) {
		get_contact(jid).nickname = nickname;
		build_contact_list();
	    },
	    avatar: function(jid, data) {
		get_contact(jid).avatar = data;
		build_contact_list();
	    }
	}
    });

    $(document).unload(function() {
	client.disconnect();
    });
$(document).ready(function () {
    $('#register').bind('click', function() {
     	var username, password, email_address;
     	username = $('#register_username').attr('value');
     	password = $('#register_password').attr('value');
     	email_address = $('#register_email').attr('value');
     	client.register(username, DOMAIN, password, email_address, function() {
     	    $('#status').text('Registration successful.');
     	    $('#unauthenticated').hide();
	    $('#authenticated').show();
     	}, function(code, message) {
     	    $('#error').text('Registration failed: ' + code + ' - ' + message).fadeIn('show');
     	});
     });
    $('#authenticate').bind('click', function () {
     	client.authenticate($('#username')[0].value, DOMAIN, $('#password')[0].value);
    });
     $('#updatestatus').bind('click', function() {
     	client.status($('#update_status')[0].value);
     });
    $('#listcontacts').bind('click', function() {
     	client.contacts();
     });
    $('#add_contact_button').bind('click', function() {
	client.add_contact($('#add_contact_jid')[0].value);
    });
});

    return that;
};


var DOMAIN = "vagrant-ubuntu-lucid";
ExampleOSWClient();

