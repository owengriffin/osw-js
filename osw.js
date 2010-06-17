var OneSocialWeb = function(options) {
    var that, logger, connection, callbacks, register, authenticate, contacts, activities, status, subscriptions, add_contact, confirm_contact, subscribe, unsubscribe;

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
    })();

    // Setup the user-defined callbacks
    options.callback = options.callback || {};
    options.callback.connection = options.callback.connection || function(status, error) {
	logger.info(status);
    };
    options.callback.connected = options.callback.connected || function() {
	logger.info('Connected!');
    };
    options.callback.connection_failed = options.callback.connection_failed || function() {
	logger.error('Unable to establish connection.');
    };
    options.callback.presence = options.callback.presence || function(from, show) {
	logger.info("User callback: Presence received");
    };
    options.callback.message = options.callback.message || function(to, from, type, body) {
	logger.info("User callback: Message received");
    };
    options.callback.contact = options.callback.contact || function(jid, name) {
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
    

    // All private callbacks
    callbacks = {};

    // Function which deals with the connection callback
    callbacks.connection = function(status, error) {
	for (name in Strophe.Status) {
	    if (Strophe.Status[name] == status) {
		options.callback.connection(name);
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
	var message, type, from;
	message = $(msg);
	type = message.attr('type');
	from = message.attr('from');

	logger.debug('Internal callback: Presence');
	logger.debug('Type: ' + type + ', From: ' + from);

	if (type === 'subscribe') {
	    // Received a subscription request
	    options.callback.presence_subscription_request(from);
	}
	if (from) {
	    show = $(msg).find('show').text();
	    options.callback.presence(from, show);
	    return true;
	}
	
    },

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
	
	 if (type == "chat" && elems.length > 0) {
	     options.callback.message(to, from, type, Strophe.getText(elems[0])); 
	 }

	 // Capture any nickname events
	 event = $('event items item nick', msg);
	 logger.debug(event);
	 if (event.length > 0) {
	     for (index = 0; index < event.length; index ++) {
		 logger.debug(event[index].textContent);
		 options.callback.nickname(from, event[index].textContent);
	     }
	 }
	 return true;
     };

    callbacks.iq = function(msg) {
	logger.info('IQ callback');
	logger.debug(msg);
	return true;
    };

    // Callback for when a successfull connection
    callbacks.connected = function() {
	logger.debug("Connected.");
	// Bind message and prescence handlers
	connection.addHandler(callbacks.message, null, 'message', null, null,  null); 
	connection.addHandler(callbacks.presence, null, 'presence', null, null, null); 
	connection.addHandler(callbacks.iq, null, 'iq', null, null, null); 
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
     * Authenticate to a OneSocialWeb server with the given credentials
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
	$(stanza).find("item").each(function() {
	    var jid = $(this).attr('jid');
	    probe_presence(jid);
	    options.callback.contact(jid, $(this).attr('name'));
	});
    };
    callbacks.roster.failure = function(stanza) {
	logger.error("Unable to list roster");
    };	

    /**
     * Fetch a list of contacts from the server
     */
    contacts = function(contact_callback) {
	var iq = $iq({
	    'from': connection.jid,
	    'type': 'get'
	}).c('query', { xmlns:OneSocialWeb.XMLNS.ROSTER });
	connection.sendIQ(iq.tree(), callbacks.roster.success, callbacks.roster.failure);
    };

    callbacks.activities = function(stanza) {
	$(stanza).find("entry").each(function() {
	    options.callback.activity($(this).find("actor uri").text(), $(this).find("title").text());
	});
    };
    activities = function() {
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

	var stanza=sub.tree();
	connection.sendIQ(stanza, 
                          function(stanza) {
			          sendiq_good = true;
			          logger.info("iq sent succesfully.");
		          },
		          function(stz) {
			      
                              if (stz) {
			          sendiq_good = true;
			      }
			      logger.debug(stz);
			      logger.error("failed to send iq.");
			      
		          });
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
	    'type': 'get'/*,
	    'to': 'pubsub.' + connection.domain*/
	}).c('pubsub', { 
	    'xmlns': OneSocialWeb.SCHEMA.PUBSUB
	}).c('subscriptions', { 
	    'xmlns': OneSocialWeb.SCHEMA.PUBSUB,
	    'node': OneSocialWeb.XMLNS.MICROBLOG
	}).tree(), callbacks.subscription);
    };

    subscribe = function(jid, callback) {
	logger.info('Subscribing to ' + jid);
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

    unsubscribe = function(jid, callback) {
	logger.info('unsubscribing to ' + jid);
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

    add_contact = function(jid) {
	logger.info('Adding contact ' + jid);
	// IQ message which adds the contact to the roster
	connection.sendIQ($iq({
	    'from': connection.jid,
	    'type': 'set'
	}).c('item', {
	    'jid': jid,
	    'name': jid
	}).c('group').t('MyBuddies'));
	// Send a subscription request to a user
	connection.send($pres({
	    'from': connection.jid,
	    'to': jid,
	    'type': 'subscribe'
	}));	    
    };

    confirm_contact = function(jid) {
	connection.sendIQ($iq({
	    'type': 'set'
	}).c('query', {
	    'xmlns': OneSocialWeb.XMLNS.ROSTER
	}).c('item', {
	    'jid': jid,
	    'name': jid
	}).c('group').t('MyBuddies'));
	connection.send($pres({
	    'from': connection.jid,
	    'to': jid,
	    'type': 'subscribed'
	}));	    
    };

    that = {};
    that.register = register;
    that.authenticate = authenticate;
    that.contacts = contacts;
    that.activities = activities;
    that.status = status;
    that.subscriptions = subscriptions;
    that.add_contact = add_contact;
    that.confirm_contact = confirm_contact;
    that.subscribe = subscribe;
    that.unsubscribe = unsubscribe;
    return that;
};
OneSocialWeb.SCHEMA = {
    PUBSUB: 'http://jabber.org/protocol/pubsub',
    ATOM: 'http://www.w3.org/2005/Atom',
    ACTIVITY_STREAMS: "http://activitystrea.ms/spec/1.0/",
    ONESOCIALWEB: 'http://onesocialweb.org/spec/1.0/'
}
OneSocialWeb.XMLNS = {
    ROSTER: 'jabber:iq:roster',
    REGISTER: 'jabber:iq:register',
    MICROBLOG: 'urn:xmpp:microblog:0'
}
