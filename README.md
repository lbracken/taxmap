taxmap
======

Geographically visualize the cost of various government programs

A running instance is hosted at http://levibracken.com/taxmap.


##Running the application

taxmap is built as a Flask application. To run:

    $ python -m taxmap

The WebUI (and web service) is then available at http://localhost:5000.

Persistence is handled by mongoDB.  Be sure to update settings.cfg with your mongoDB configuration.  Why use mongoDB for such a simple application?  No good reason other than mongoDB is already installed and used on the server where taxmap is live hosted.