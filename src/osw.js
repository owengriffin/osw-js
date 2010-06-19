/*jslint nomen: true, debug: true, evil: false, onevar: true, white: false*/
var $, $iq, $pres, jQuery, Strophe, console;
/**
 * Class: OneSocialWeb
 * 
 * Methods for interacting with a OneSocialWeb server using Strophe.js.
 *
 * Parameters:
 *
 * options - an object containing options for connecting to a OneSocialWeb server
 **/
var OneSocialWeb = function(options) {
    var that, logger, connection, callbacks, register, authenticate, contacts, inbox, status, subscriptions, add_contact, confirm_contact, follow, unfollow, vcard, update_contact, edit_profile, probe_presence;

    // A logger which uses the Firebug 'console'
    logger = {
	debug: function(msg) {
	    if (typeof(console) !== 'undefined') {
		console.debug(msg);
	    }
	},
	info: function(msg) {
	    if (typeof(console) !== 'undefined') {
		console.info(msg);
	    }
	},
	error: function(msg) {
	    if (typeof(console) !== 'undefined') {
		console.error(msg);
	    }
	}
    };

    // Initialize a connection to the BOSH endpoint
    (function() {
	logger.debug('Creating connection to : ' + options.bosh_url);
	connection = new Strophe.Connection(options.bosh_url);
	connection.rawInput = function(msg) { logger.debug('IN ' + msg); };
	connection.rawOutput = function(msg) { logger.debug('OUT ' + msg); };
    }());

    /**
     * Property: options.callback
     *
     * A map of user-defined callbacks
     **/
    options.callback = options.callback || {};

    /**
     * Property: options.callback.connection
     *
     * Invoked every time the connection status is updated
     *
     * Parameters: 
     * 
     * status - The current Strophe.Status
     **/
    options.callback.connection = options.callback.connection || function(status, error) {
	logger.info(status);
    };

    /**
     * Property: options.callback.connection
     *
     * Invoked when a connection has been established
     **/
    options.callback.connected = options.callback.connected || function() {
	logger.info('Connected!');
    };

    /**
     * Property: options.callback.connection_failed
     *
     * Invoked when the connection has failed
     **/
    options.callback.connection_failed = options.callback.connection_failed || function() {
	logger.error('Unable to establish connection.');
    };

    /**
     * Property: options.callback.presence
     *
     * Invoked when a presence message is received
     *
     * Parameters:
     * 
     * from - The Jabber identifier of the user whose presence has been updated
     * show - A description of their current presence
     **/
    options.callback.presence = options.callback.presence || function(from, show) {
	logger.info("User callback: Presence received");
    };
    options.callback.message = options.callback.message || function(to, from, type, body) {
	logger.info("User callback: Message received");
    };
    options.callback.contact = options.callback.contact || function(jid, name, groups) {
	logger.info("User callback: Contact received");
    };
    options.callback.activity = options.callback.activity || function(jid, text) {
	logger.info("User callback: Activity received");
    };
    // Callback from a pub-sub list subscriptions
    options.callback.subscription = options.callback.subscription || function(jid, type) {
	logger.info("User callback: Subscription to " + jid);
    };
    options.callback.presence_subscription_request = options.callback.presence_subscription_request || function(jid) {
	logger.info("User callback: Received presence subscription request from: " + jid);
    };
    options.callback.nickname = options.callback.nickname || function(jid, nickname) {
	logger.info('User callback: Nickname of ' + jid + ' is ' + nickname);
    };

    /**
     * Property: options.callback.avatar
     *
     * Invoked when a user's avatar has been changed
     *
     * Parameters:
     * 
     * jid - The Jabber identifier of the user whose avatar has been updated
     * data - PNG image data of the new avatar
     **/
    options.callback.avatar = options.callback.avatar || function(jid, data) {
	logger.info("User callback: Photo of " + jid);
    };

    // All private callbacks
    callbacks = {};

    // Function which deals with the connection callback
    callbacks.connection = function(status, error) {
	var st;
	for (st in Strophe.Status) {
	    if (Strophe.Status[st] === status) {
		options.callback.connection(st);
	    }
	}
	if (status === Strophe.Status.CONNECTED) {
	    callbacks.connected();
	} else if (status === Strophe.Status.CONNFAIL) {
	    options.callback.connection_failed();
	} else {
	    logger.error(error);
	    logger.debug(status);
	}
    };

    callbacks.presence = function(msg) {
	var message, type, from, x, show;
	logger.debug('Internal callback: Presence');

	message = $(msg);
	type = message.attr('type');
	from = message.attr('from');

	if (type === 'subscribe') {
	    // Received a subscription request
	    options.callback.presence_subscription_request(from);
	} else if (type =='subscribed') {
	    logger.info("Subscribed");
	    options.callback.presence(from, 'subscribed');
	}
	x = message.children('x');
	if (x.length > 0) {
	    x = $(x[0]); 
	    if (x.attr('xmlns') === OneSocialWeb.XMLNS.VCARDUPDATE) {
		if (x.children('photo')) {
		    // TODO: The <photo> element contains a SHA-1 hash of the image. We need
		    // to compare the hash with the current one stored for the user. If it has
		    // changed then we request the avatar from the user.
		    // Request a new VCARD from the user
		    vcard(Strophe.getBareJidFromJid(from));
		    return true;
		}
	    }
	}
	    
	if (from) {
	    show = $(msg).find('show').text();
	    options.callback.presence(from, show);
	    return true;
	}
    };

    /**
     * Callback when there is a new message
     **/
     callbacks.message = function(msg) {
	 var to, from, type, elems, event, index;
	 logger.debug("Internal callback: Message");
	 logger.debug(msg);
	 to = msg.getAttribute('to');
	 from = msg.getAttribute('from');
	 type = msg.getAttribute('type');
	 elems = msg.getElementsByTagName('body');
	
	 if (type === "chat" && elems.length > 0) {
	     options.callback.message(to, from, type, Strophe.getText(elems[0])); 
	 }

	 if (type === "headline") {
	     callbacks.activities(msg);
	 }

	 // Capture any nickname events
	 event = $('event items item nick', msg);	 
	 if (event.length > 0) {
	     for (index = 0; index < event.length; index = index + 1) {
		 options.callback.nickname(from, event[index].textContent);
	     }
	 }

	 // Capture any avatar change events
	 event = $('event items item data', msg);
	 if (event.length > 0) {
	     options.callback.avatar(from, event[0].textContent);
	 }

	 return true;
     };

    // Callback for when a successfull connection
    callbacks.connected = function() {
	logger.debug("Connected.");
	// Bind message and prescence handlers
	connection.addHandler(callbacks.message, null, 'message', null, null,  null); 
	connection.addHandler(callbacks.presence, null, 'presence', null, null, null); 
	// Update the prescence
	connection.send($pres().tree());
	options.callback.connected();
	return true;
    };    

    register = function(username,
			    domain, 
			    password, 
			    email_address, 
			    success_callback, 
			    error_callback) {
	var iq;

	// Tell Strophe to initiate a connection. This only appears to have the purpose
	// of setting the domain. There must be a better way of doing this.
	connection.connect('', domain, '', callbacks.connection);

	logger.info('Attempting to register with: ' + username + ', ' + password + ', ' + email_address);
	iq = $iq({'type':'set'})
	    .c('query', {'xmlns': OneSocialWeb.XMLNS.REGISTER})
	    .c('username').t(username).up()
	    .c('password').t(password).up()
	    .c('email').t(email_address);
	logger.debug(iq.tree());
	connection.sendIQ(iq.tree(), function(stanza) {
	    connection.disconnect();
	    connection.reset();
	    success_callback();
	}, function(stanza) {
	    var error, message, code;
	    error = $(stanza).find("error");
	    message = error.children()[0].tagName;
	    code = error.attr('code');
	    error_callback(code, message);
	}); 
    };

    /** 
     * Function: authenticate
     * 
     * Authenticates with a OneSocialWeb server using the specified credentials.
     * 
     * Parameters:
     * 
     * username - XMPP username
     * domain - Domain of the XMPP server
     * password - Plain text password of the XMPP username
     **/
    authenticate = function(username, domain, password) {
	logger.debug('Connecting with username ' + username);
	connection.connect(username, domain, password, callbacks.connection);
    };

    /** Private method: Probes the prescene of a specified jid */
    probe_presence = function(jid) {
	connection.send($pres(
	    {'type':'probe',
	     'from':connection.jid, 
	     'to':jid
	    }).tree());
    };

    callbacks.roster = {};
    callbacks.roster.success = function(stanza) {
	logger.debug("Rooster request successful");
	$(stanza).find("item").each(function() {
	    var item, jid, groups;
	    item = $(this);
	    jid = item.attr('jid');
	    logger.info(jid + " " + item.attr('name') + " " + item.attr("subscription"));
	    //probe_presence(jid);
	    // Generate a list of groups which this contact is a member of
	    groups = jQuery.map(item.children('group'), function(element) { 
		return $(element).text(); 
	    });
	    options.callback.contact(jid, item.attr('name'), groups);
	    //vcard(jid);
	});
    };
    callbacks.roster.failure = function(stanza) {
	logger.error("Unable to list roster");
    };	

    /**
     * Function: contacts
     * 
     * Requests a list of the current user's contacts from the server. This will call the 
     * options.callback.contact function when each contact is received from the server.
     */
    contacts = function() {
	var iq = $iq({
	    'from': connection.jid,
	    'type': 'get'
	}).c('query', { xmlns:OneSocialWeb.XMLNS.ROSTER });
	connection.sendIQ(iq.tree(), callbacks.roster.success, callbacks.roster.failure);
    };

    callbacks.activities = function(stanza) {
	var object_type;
	$(stanza).find("entry").each(function() {
	    object_type = $(this).find("object object-type").text();
	    if (object_type === "http://onesocialweb.org/spec/1.0/object/status") {
		options.callback.activity($(this).find("actor uri").text(), $(this).find("object content").text());
	    }
	});
    };

    /**
     * Function: inbox
     * 
     * List the inbox of activities for the current user.
     **/
    inbox = function() {
	var sub = $iq({
	    'from' : connection.jid, 
	    'type' : 'get'
	}).c('pubsub', {
	    'xmlns': OneSocialWeb.SCHEMA.PUBSUB 
	}).c('items', {
	    'node' : 'http://onesocialweb.org/spec/1.0/inbox'
	});
	connection.sendIQ(sub.tree(), callbacks.activities, function(st) {
	    logger.error('Unable to send IQ to receive activities');
	    logger.debug(st);
	});
    };

    /**
     * Function: status
     *
     * Update the status of the current user
     *
     * Parameters:
     *
     * text - The status update
     **/
    status = function(text) {
	var sub = $iq({
	    'from': connection.jid, 
	    'type': 'set'
	}).c('pubsub', { 
	    'xmlns': OneSocialWeb.SCHEMA.PUBSUB 
	}).c('publish', { 
	    'node': OneSocialWeb.XMLNS.MICROBLOG
	}).c('item').c('entry', {
	    'xmlns': OneSocialWeb.SCHEMA.ATOM,
	    'xmlns:activity': OneSocialWeb.SCHEMA.ACTIVITY_STREAMS,
	    'xmlns:osw': OneSocialWeb.SCHEMA.ONESOCIALWEB
	}).c('published').up()
	    .c('title').t(text).up()
	    .c('activity:verb').t('http://activitystrea.ms/schema/1.0/post')
	    .up()
	    .c('activity:object')
	    .c('activity:object-type').t('http://onesocialweb.org/spec/1.0/object/status')
	    .up()
	    .c('content', {'type':'text/plain'}).t(text)
	    .up()
	    .up()
	    .c('osw:acl-rule')
	    .c('osw:acl-action', {'permission': 'http://onesocialweb.org/spec/1.0/acl/permission/grant'}).t('http://onesocialweb.org/spec/1.0/acl/action/view')
	    .up()
	    .c('osw:acl-subject', {'type':'http://onesocialweb.org/spec/1.0/acl/subject/everyone'});

	connection.sendIQ(sub.tree());
    };

    callbacks.subscription = function(stanza) {
	logger.debug(stanza);
	$(stanza).find("subscription").each(function() {
	    var subscription = $(this);

	    options.callback.subscription(subscription.attr('jid'), subscription.attr('subscription'));
	});
    };
    subscriptions = function() {
	connection.sendIQ($iq({
	    'from': connection.jid, 
	    'type': 'get'
	}).c('pubsub', { 
	    'xmlns': OneSocialWeb.SCHEMA.PUBSUB
	}).c('subscriptions', { 
	    'xmlns': OneSocialWeb.SCHEMA.PUBSUB,
	    'node': OneSocialWeb.XMLNS.MICROBLOG
	}).tree(), callbacks.subscription);
    };

    /**
     * Function: follow
     *
     * Subscribes the current user to the activity stream of the specified user.
     *
     * Parameters:
     *
     * jid - The Jabber identifier of the user to 'follow'
     * callback - A function which is called when the 'follow' request is successful
     **/
    follow = function(jid, callback) {
	logger.info('Requesting to follow: ' + jid);
	connection.sendIQ($iq({
	    'from': connection.jid, 
	    'type': 'set',
	    'to': jid
	}).c('pubsub', { 
	    'xmlns': OneSocialWeb.SCHEMA.PUBSUB
	}).c('subscribe', { 
	    'xmlns': OneSocialWeb.SCHEMA.PUBSUB,
	    'node': OneSocialWeb.XMLNS.MICROBLOG,
	    'jid' : Strophe.getBareJidFromJid(connection.jid)
	}).tree(), function(stanza) {
	    logger.info("Subscribe request complete");
	    logger.debug(stanza);
	    callback();
	}, function(stanza) {
	    logger.info("Subscribe request unsuccssful");
	    logger.debug(stanza);
	});
    };

    /**
     * Function: unfollow
     *
     * Unsubscribes the current user to the activity stream of the specified user.
     *
     * Parameters:
     *
     * jid - The Jabber identifier of the user to 'follow'
     * callback - A function which is called when the 'unfollow' request is successful
     **/
    unfollow = function(jid, callback) {
	logger.info('Requesting to unfollow: ' + jid);
	connection.sendIQ($iq({
	    'from': connection.jid, 
	    'type': 'set',
	    'to': jid
	}).c('pubsub', { 
	    'xmlns': OneSocialWeb.SCHEMA.PUBSUB
	}).c('unsubscribe', { 
	    'xmlns': OneSocialWeb.SCHEMA.PUBSUB,
	    'node': OneSocialWeb.XMLNS.MICROBLOG,
	    'jid' : Strophe.getBareJidFromJid(connection.jid)
	}).tree(), function(stanza) {
	    logger.info("Unsubscribe request complete");
	    logger.debug(stanza);
	    callback();
	}, function(stanza) {
	    logger.info("Unsubscribe request unsuccssful");
	    logger.debug(stanza);
	});
    };

    /**
     * Function: add_contact
     *
     * Adds a new contact to the rooster
     *
     * Parameters:
     * 
     * jid - The Jabber identifier of the user to add
     **/
    add_contact = function(jid) {
	logger.info('Adding contact ' + jid);
	// IQ message which adds the contact to the roster
	connection.sendIQ($iq({
	    'from': connection.jid,
	    'type': 'set'
	}).c('item', {
	    'jid': jid,
	    'name': jid
	}).c('group').t('MyBuddies'), callbacks.roster.success);
	// Send a subscription request to a user
	connection.send($pres({
	    'from': connection.jid,
	    'to': jid,
	    'type': 'subscribe'
	}), function(stanza) {
	    logger.info("Subscription request successful");
	    logger.debug(stanza);
	});	    
    };

    /**
     * Function: confirm_contact
     *
     * Confirm the addition of a contact 
     *
     * Parameters:
     *
     * jid - The Jabber identifier of the user requesting to be a contact
     * group - The name of the group which this contact should belong to
     **/
    confirm_contact = function(jid, group) {
	connection.sendIQ($iq({
	    'type': 'set'
	}).c('query', {
	    'xmlns': OneSocialWeb.XMLNS.ROSTER
	}).c('item', {
	    'jid': jid,
	    'name': jid
	}).c('group').t(group), callbacks.roster.success);
	connection.send($pres({
	    'from': connection.jid,
	    'to': jid,
	    'type': 'subscribed'
	}, function(stanza) {
	    logger.info("Subscription request successful");
	    logger.debug(stanza);
	}));	    
    };

    /**
     * Function: vcard
     *
     * Request a VCARD of a specified user.
     *
     * Parameters:
     * 
     * jid - The Jabber Identifier of the user you wish to request the VCARD
     **/
    vcard = function(jid) {
	connection.sendIQ($iq({
	    'type': 'get',
	    'to': jid,
	    'xmlns': OneSocialWeb.XMLNS.CLIENT
	}).c('vCard', {
	    'xmlns': OneSocialWeb.XMLNS.VCARDTEMP
	}), function(stanza) {
	    var photo;
	    photo = $(stanza).find('PHOTO BINVAL');
	    if (photo.length > 0) {
		photo = $(photo[0]).text();
		options.callback.avatar(jid, photo);
	    }
	});
    };

    /**
     * Function: update_contact
     *
     * Updates a contact in the rooster
     *
     * Parameters: 
     * 
     * jid - The Jabber identifier of the user you wish to update
     * name - Name of the contact
     * groups - A list of group names
     **/
    update_contact = function(jid, name, groups) {
	var iq = $iq({
	    'type': 'set',
	    'from': connection.jid
	}).c('query', {
	    'xmlns': OneSocialWeb.XMLNS.ROSTER
	}).c('item', {
	    'jid' : jid,
	    'name' : name, 
	    'subscription' : 'both'
	});
	$.each(groups, function(index, group) {
	    iq.c('group').t(group).up();
	});
	connection.sendIQ(iq);
    };

    edit_profile = function(nickname) {
	connection.sendIQ($iq({
	    'type': 'set',
	    'from': connection.jid
	}).c('pubsub', {
	    'xmlns': OneSocialWeb.SCHEMA.PUBSUB
	}).c('publish', {
	    'node' : OneSocialWeb.SCHEMA.NICKNAME
	}).c('item', {
	    'id': 0
	}).c('nick', {
	    'xmlns' : OneSocialWeb.SCHEMA.NICKNAME
	}).t(nickname));
    };

    that = {};
    that.register = register;
    that.authenticate = authenticate;
    that.contacts = contacts;
    that.inbox = inbox;
    that.status = status;
    that.subscriptions = subscriptions;
    that.add_contact = add_contact;
    that.update_contact = update_contact;
    that.confirm_contact = confirm_contact;
    that.follow = follow;
    that.unfollow = unfollow;
    that.vcard = vcard;
    that.edit_profile = edit_profile;
    return that;
};
OneSocialWeb.SCHEMA = {
    PUBSUB: 'http://jabber.org/protocol/pubsub',
    ATOM: 'http://www.w3.org/2005/Atom',
    ACTIVITY_STREAMS: "http://activitystrea.ms/spec/1.0/",
    ONESOCIALWEB: 'http://onesocialweb.org/spec/1.0/',
    NICKNAME: 'http://jabber.org/protocol/nick'
};
OneSocialWeb.XMLNS = {
    CLIENT: 'jabber:client',
    ROSTER: 'jabber:iq:roster',
    REGISTER: 'jabber:iq:register',
    MICROBLOG: 'urn:xmpp:microblog:0',
    VCARDTEMP: 'vcard-temp',
    VCARDUPDATE: 'vcard-temp:x:update'
};
