/*jslint nomen: true, debug: true, evil: false, onevar: true, white: false, browser: true*/
var $, $iq, $pres, jQuery, Strophe, console, OneSocialWeb;

var DOMAIN = "vagrant-ubuntu-lucid";

/**
 * Class: Contact
 *
 * Represents a contact of the current user
 **/
var Contact = function(jid) {
    return {
	jid: jid,
	element_class: Strophe.getNodeFromJid(jid) + '_' +  Strophe.getDomainFromJid(jid).replace(/[\-\/\.]/g,''),
	status: '',
	avatar: '',
	nickname: '',
	groups: [],
	subscription: '',
	
	/**
	 * Function: has_element
	 *
	 * Returns true if an element exists which contains information about this contact.
	 **/
	has_element: function() {
	    return ($('.' + this.element_class).length > 0);
	},
	
	/**
	 * Function: get_nickname
	 *
	 * Returns the current nickname of the contact. If no nickname
	 * has been received then the JID will be returned.
	 **/
	get_nickname: function() {
	    var retval = this.jid;
	    if (this.nickname !== '') {
		retval = this.nickname;
	    }
	    return retval;
	},
	
	/**
	 * Function: update_nickname
	 *
	 * Update all elements which contain the nickname of the Contact
	 *
	 **/
	update_nickname: function() {
	    var contact = this;
	    if (this.has_element()) {
		$.each($('.' + this.element_class + ' .nickname'), function(index, value) {
		    $(value).text(contact.get_nickname());
		});
	    }
	},
	/**
	 * Function: update_status
	 *
	 * Update all elements which contain the status of the Contact
	 **/
	update_status: function() {
	    var contact = this;
	    if (this.has_element() && contact.status !== '') {
		$.each($('.' + this.element_class), function(index, value) {
		    var element = $(value);
		    element.removeClass(function(index, className) {
			return className.substring(0,3)==='st_';
		    });
		    element.addClass('st_' + contact.status);
		});
	    }
	},
	/**
	 * Function: update_following
	 *
	 * Update all elements which show the follow status of the Contact
	 **/
	update_following: function() {
	    var contact = this;
	    if (this.has_element() && contact.subscription !== '') {
		$.each($('.' + this.element_class + ' .subscription'), function(index, element) {
		    $(element).text('[' + (contact.subscription === 'subscribed' ? 'unfollow' : 'follow') + ']');
		});
	    }
	},
	/**
	 * Function: update_avatar
	 *
	 * Update all elements which contain the avatar of a specified <Contact>
	 **/
	update_avatar: function() {
	    var contact = this;
	    if (this.has_element() && 
		typeof(contact.avatar) !== 'undefined' &&
		contact.avatar !== '') {
		$.each($('.' + contact.element_class + ' .avatar'), function(index, value) {
		    $(value).attr('src', 'data:image/png;base64,' + contact.avatar);
		});
	    }
	}
    };
};

/**
 * Class: ExampleOSWClient
 *
 **/
var ExampleOSWClient = function() {
    var that, client, contacts, build_contact_list, get_contact, add_activity, add_group, create_group_element, create_contact_element;

    contacts = [];

    /**
     * Function: get_contact
     *
     * Returns a contact
     **/
    get_contact = function(jid) {
	var index, node, contact;

	jid = Strophe.getNodeFromJid(jid) + '@' + Strophe.getDomainFromJid(jid) ;

	if (contacts.length > 0) {
	    for (index = 0; index < contacts.length; index = index + 1) {
		if (contacts[index].jid === jid) {
		    return contacts[index];
		}
	    }
	}
	contact = new Contact(jid);
	contacts.push(contact);
	return contact;
    };

    /**
     * Function: ExampleOSWCLient.add_activity
     *
     * Callback for when a new microblogging activity is received.
     *
     * See: OneSocialWeb.callback.activity
     **/
    add_activity = function(jid, activity) {
	var contact;
	contact = get_contact(jid);
	$('#activitylist').append('<li class="' + contact.element_class + '"><span class="nickname">' + contact.get_nickname() + '</span><br/>' + activity + '</li>');
    };

    /** 
     * Function: ExampleOSWCLient.add_group
     * 
     * Add's a contact to a specific group
     **/
    add_group = function(name, jid) {
	var contact = get_contact(jid);
	contact.groups.push(name);
	client.update_contact(contact.jid, contact.nickname, contact.groups);
	$.each($('.' + contact.element_class + ' .groups *:last-child'), function(index, element) {
	    $(element).prev().append(create_group_element(contact, name));
	});
    };

    /**
     * Function: ExampleOSWCLient.create_group_element
     *
     * Creates a DOM element which is part of a list of groups.
     **/
    create_group_element = function(contact, name) {
	var group_element = $(document.createElement('li'));
	group_element.text(name);
	// Create a remove button to this group
	group_element.append((function() {
	    var remove_element = $(document.createElement('span'));
	    remove_element.text('[remove]');
	    remove_element.data('jid', contact.jid);
	    remove_element.addClass('action');
	    remove_element.bind('click', {
		contact: contact,
		group: name
	    }, function(event) { 
		alert('This will remove ' + event.data.group +' from ' + event.data.contact.jid); 
	    });
	    return remove_element;
	}()));
	return group_element;
    };

    create_contact_element = function(contact) {
	var element, group_list, contactlist_element, group_element, create_subscription_element, create_group_list_element, group_prompt_handler;

	create_subscription_element = function(contact) {
	    var subscription_element;
	    subscription_element = $(document.createElement('span'));
	    subscription_element.addClass('subscription action');
	    subscription_element.text('[follow]');
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
	    return subscription_element;
	};

	create_group_list_element = function(group_list, contact) {
	    $.each(contact.groups, function(index, value) {
		group_list.append(create_group_element(contact, value));
	    });
	};

	group_prompt_handler = function(event) {
	    var group_name = prompt('Enter a name of the group');
	    add_group(group_name, event.data.contact.jid);
	};

	contactlist_element = $('#contactlist');

	if (!contact.has_element()) {
	    element = $(document.createElement('li'));
	    element.addClass(contact.element_class);
	    element.addClass('contact');
	    element.append('<img src="" class="avatar"/><span class="nickname">' + contact.jid + '</span>');
	    // Create a button indicating if this contact is followed or not
	    element.append(create_subscription_element(contact));
	    
	    // Create a list for containing the groups belonging to the contact
	    group_list = $(document.createElement('ul'));
	    group_list.addClass('groups');
	    // Populate group list for the element
	    create_group_list_element(group_list, contact);
	    
	    // Add an 'add' to the group list which will add another group to the contact
	    group_element = $(document.createElement('li'));
	    group_element.text('[add]');
	    group_element.addClass('action');
	    group_element.data('jid', contact.jid);
	    group_element.bind('click', {
		contact: contact
	    }, group_prompt_handler);
	    group_list.append(group_element);
	    // Add the group list to the contact
	    element.append(group_list);
	    contactlist_element.append(element);
	}

	contact.update_status();
	contact.update_nickname();
	contact.update_avatar();
	contact.update_following();
    };

    build_contact_list = function() {
	var index, contact;
	if (contacts.length > 0) {
	    for (index = 0; index < contacts.length; index = index + 1) {
		contact = contacts[index];
		create_contact_element(contact);
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
		var contact = get_contact(id);
		contact.name = name;
		contact.groups = groups;
		build_contact_list();
	    },
	    activity: add_activity,
	    presence: function(jid, show) {
		var contact = get_contact(jid);
		contact.status = show;
		if (contact.has_element()) {
		    contact.update_status();
		} else {
		    create_contact_element(contact);
		}
	    },
	    subscription: function(jid, type) {
		var contact = get_contact(jid);
		contact.subscription = type;
		contact.update_following();
	    },
	    presence_subscription_request: function(jid) {
		var button = $(document.createElement('input'));
		button.attr('type', 'button');
		button.attr('value', 'Accept');
		$('#status').text('You have received a presence subscription from: ' + jid);
		$('#status').append(button);
		button.bind('click', function() {
		    client.confirm_contact(jid);
		    client.add_contact(jid, 'Friends');
		    $('#status').html('');
		});
	    },
	    message: function(to, from, type, text) {
		$('#messages').prepend('<p>@' + from + ': ' + text + '</p>');
	    },
	    nickname: function(jid, nickname) {
		var contact = get_contact(jid);
		contact.nickname = nickname;
		contact.update_nickname();
	    },
	    avatar: function(jid, data) {
		var contact = get_contact(jid);
		contact.avatar = data;
		contact.update_avatar();
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
		client.authenticate(username, DOMAIN, password);
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
	$('#add_contact_button').bind('click', function() {
	    client.add_contact($('#add_contact_jid')[0].value);
	});
	$('#edit_profile_button').click(function() {
	    client.edit_profile($('#profile .nickname').first().val());
	});
    });

    return that;
};

(ExampleOSWClient());
