# OneSocialWeb Javascript client

## What is this?

This is an experiment in connecting to a OneSocialWeb server using Javascript. 

## What does this do?

* Authenticate with a OneSocialWeb or XMPP server
* List the statuses in your inbox
* Update your current status
* List your contacts and their current availability
* Group your contacts in a rooster

## How do I run this?

* Ensure you have a local OneSocialWeb server running and an instance of the OneSocialWeb web client
* Host the files on your web server

# Build Environment

## JSLint

Using the following command will run JSLint on all Javascript source files.

    $ rake jslint:jslint
    
If this command fails then you will need to run the following:
  
    $ rake jslint:install
    
This will install JSLint and Rhino into the vendor folder. Please ensure that the vendor folder is not committed into the source tree.

## Documentation

The following command will use NaturalDocs to generate documentation

    $ rake naturaldocs:generate
    
You will need to have installed NaturalDocs for this command to work:

    $ sudo apt-get install naturaldocs

## Tests

osw-js uses Cucumber and Selenium to run integration tests. 

You will need to ensure that you have these installed:

    $ gem install cucumber selenium-webdriver
    
To run all of the tests run the following command:

    $ cucumber .
    
More information on the testing setup can be
seen on [Testing Browsers Concurrently](http://www.owengriffin.com/posts/2010/06/11/Testing_browsers_concurrently.html).

### Individual scenarios

By default Cucumber will run all the scenarios available. It is possible to run individual scenarios by using the following command:

    $ cd features/
    $ cucumber registration.feature -r support/env.rb -r step_definition/
    
