var OSW = {

    // The location of the BOSH service
    BOSH_SERVICE: '/bosh',

    SCHEMA: {
	ROSTER: 'jabber:iq:roster',
	PUBSUB: 'http://jabber.org/protocol/pubsub',
	ATOM: 'http://www.w3.org/2005/Atom',
	ACTIVITY_STREAMS: "http://activitystrea.ms/spec/1.0/",
    },

    logger: {
	debug: function(msg) {
	    console.debug(msg);
	},
	info: function(msg) {
	    console.info(msg);
	},
	error: function(msg) {
	    console.error(msg);
	}
    },

    callbacks: {
	presence: function(jid, show) {
	    OSW.logger.info('Default presence callback: ' + jid + ' is ' + show);
	}
    },

    /** 
     * Connect to a OneSocialWeb server with the given credentials
     **/
    connect: function(username, password) {
	OSW.logger.debug('Connecting with username ' + username);
	if (typeof(OSW.connection) === 'undefined') {
	    OSW.connection = new Strophe.Connection(OSW.BOSH_SERVICE);
	    OSW.connection.rawInput = function(msg) { OSW.logger.debug('IN: ' + msg); };
	    OSW.connection.rawOutput = function(msg) { OSW.logger.debug('OUT: ' + msg); };
	}
	OSW.connection.connect(username, password, OSW.onConnect);
    },

    contacts: function(callback) {
	var sub = $iq({from:OSW.connection.jid, id:'rooster_1',type:'get'})
	    .c('query', { xmlns:OSW.SCHEMA.ROSTER });
	var callbacks = {
	    success: function(stanza) {
		OSW.logger.info('Sent successfully');
		$(stanza).find("item").each(function() {
		    var jid = $(this).attr('jid');
		    OSW.connection.send($pres({'type':'probe','from':OSW.connection.jid, 'to':jid}).tree());
		    callback(jid, $(this).attr('name'));
		});
	    },
	    error: function(stanza) {
		OSW.logger.error("Failed to send IQ");
		OSW.logger.debug(stanza);
	    }
	};
	OSW.connection.sendIQ(sub.tree(), callbacks.success, callbacks.failure);
    },

    activities: function(callback) {
	OSW.callback = callback;
	var sub = $iq({from:OSW.connection.jid, id:'osw2', type:'get'})
	    .c('pubsub', { xmlns: OSW.SCHEMA.PUBSUB })
	    .c('items',{'node':'http://onesocialweb.org/spec/1.0/inbox'});
	var stanza = sub.tree();
	OSW.logger.debug(stanza);
	OSW.connection.sendIQ(stanza, OSW.onActivities, function(st) {
	    OSW.logger.error('Unable to send IQ to receive activities');
	    OSW.logger.debug(st);
	});
    },

    status: function(status) {
	var sub = $iq({from:OSW.connection.jid, id:'osw',type:'set'})
	    .c('pubsub', { xmlns:OSW.SCHEMA.PUBSUB })
            .c('publish', { node:'urn:xmpp:microblog:0' })
	    .c('item')
	    .c('entry', {
		'xmlns': OSW.SCHEMA.ATOM,
		'xmlns:activity': OSW.SCHEMA.ACTIVITY_STREAMS,
		'xmlns:osw': 'http://onesocialweb.org/spec/1.0/'
	    })
	    .c('published')
	    .up()
	    .c('title').t(status)
	    .up()
	    .c('activity:verb').t('http://activitystrea.ms/schema/1.0/post')
	    .up()
	    .c('activity:object')
	    .c('activity:object-type').t('http://onesocialweb.org/spec/1.0/object/status')
	    .up()
	    .c('content', {'type':'text/plain'}).t(status)
	    .up()
	    .up()
	    .c('osw:acl-rule')
	    .c('osw:acl-action', {'permission': 'http://onesocialweb.org/spec/1.0/acl/permission/grant'}).t('http://onesocialweb.org/spec/1.0/acl/action/view')
	    .up()
	    .c('osw:acl-subject', {'type':'http://onesocialweb.org/spec/1.0/acl/subject/everyone'});

	var stanza=sub.tree();
	console.debug(stanza);
	OSW.connection.sendIQ(stanza, 
                          function(stanza) {
			          sendiq_good = true;
			          OSW.logger.info("iq sent succesfully.");
		          },
		          function(stz) {
			      
                              if (stz) {
			          sendiq_good = true;
			      }
			      console.debug(stz);
			      OSW.logger.error("failed to send iq.");
			      
		          });
    },

    /**
     * Callback when connection is complete.
     **/
    onConnect: function(status) {
	if (status == Strophe.Status.CONNECTED) {
	    OSW.logger.info('Connected!');
	    OSW.onConnected();
	} else if (status == Strophe.Status.CONNFAIL) {
	    OSW.logger.error('Unable to connect. boo');
	}
    },

    /**
     * Callback when there is a successfull connection.
     **/
    onConnected: function() {
	// Bind message and prescence handlers
	OSW.connection.addHandler(OSW.onMessage, null, 'message', null, null,  null); 

	// Update the prescence
	OSW.connection.send($pres().tree());

	OSW.connection.addHandler(OSW.onPresence, null, 'presence', null, null, null); 
    },

    onPresence: function(msg) {
	OSW.logger.debug(msg);
	from = $(msg).attr('from');
	show = $(msg).find('show').text();
	OSW.callbacks.presence(from, show);
	return true;
    },

    /**
     * Callback when there is a new message
     **/
    onMessage: function(msg) {
	OSW.logger.info('Got message');
	OSW.logger.debug(msg);
	var to = msg.getAttribute('to');
	var from = msg.getAttribute('from');
	var type = msg.getAttribute('type');
	var elems = msg.getElementsByTagName('body');
	
	if (type == "chat" && elems.length > 0) {
	    var body = elems[0];
	    OSW.logger.info('ECHOBOT: I got a message from ' + from + ': ' + 
		Strophe.getText(body));
	}
	
	// we must return true to keep the handler alive.  
	// returning false would remove it after it finishes.
	return true;
    },

    onActivities: function(stanza) {
	OSW.logger.info('Received activities');
	OSW.logger.debug(stanza);
	$(stanza).find("entry").each(function() {
	    OSW.callback($(this).find("actor uri").text(), $(this).find("title").text());
	});
    }
};