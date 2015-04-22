# taxmap

taxmap is a project to geographically visualize the cost of various government programs.

A running instance is hosted at http://levibracken.com/taxmap.
  
##Running the application

taxmap uses MongoDB for persistnce. By default it tries to connect to a mongo instance at `localhost:27017`. To use a different host:port, update `settings.cfg`.

To run taxmap locally...

    $ python taxmap.py

You can then access the WebUI at http://localhost:5000.

To populate the DB with data, run the following shell script.

    $ ./loadData.sh

## Docker

This project can be deployed as a Docker container. The taxmap image does not include MongoDB by default, it must be linked to another container with MongoDB.  When linking to another container there's no need to update `settings.cfg`.

To build a taxmap image...

	$ docker build -t="taxmap" .

To start a taxmap container (and the official MongoDB container)...

	$ docker run -d -P --name mongo mongo
	$ docker run -d -P --name taxmap --link mongo:db taxmap

If deploying as a Docker container, you'll still need to populate the DB with data by updating `settings.cfg` to point at the mongo DB container and running `loadData.sh`.