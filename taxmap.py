# -*- coding: utf-8 -*-
"""
    taxmap.taxmap
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Provides Flask based template rendering and web service support for
    taxmap.  Its responsibilities for web service calls includes...
      * Handling incoming HTTP requests by parsing arguments
      * Call the appropriate service module for data
      * Create a response from the data

    :license: MIT, see LICENSE for more details.
"""

import argparse
import traceback

from flask import abort
from flask import Flask
from flask import jsonify
from flask import make_response
from flask import render_template
from flask import request

from service import region_service

app = Flask(__name__)
verbose = False


@app.route("/")
def main_page():
    return render_template("index.html")


@app.route("/determine_tax_map")
def determine_tax_map():

    # Read and validate request arguments
    try:
        zip = request.args.get("zip", "").strip().lower()
        prgm_name = request.args.get("prgm_name", "").strip().lower()
        prgm_cost = int(request.args.get("prgm_cost", 0))

        # Ensure the request parameters are valid, otherwise return a 400
        if len(zip) != 5 or prgm_cost < 1:
            abort(400)

        if verbose:
            print ">>>>>>>>>>>>>>>>>>>>>> determine_tax_map"
            print " * ZIP: %s" % zip
            print " * Program Name: %s" % prgm_name
            print " * Program Cost: %d" % prgm_cost

    except Exception,e :
        # If there are problems reading the request arguments, then
        # the request is bad.  Return a 400 HTTP Status Code - Bad
        # Request
        if verbose:
            print "  %s" % str(e)
            traceback.print_exc() 
        abort(400)

    # Determine the tax map for this zip code
    response = region_service.determine_tax_map(zip, prgm_name, prgm_cost)

    if verbose:
        print response
        print "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"

    return make_response(jsonify(response))


def parse_args():
    """ Parse the command line arguments

    """
    global verbose

    parser = argparse.ArgumentParser(description="taxmap web service")
    parser.add_argument("-v", "--verbose", action="store_true",
            help="Make the operation talkative")
    args = parser.parse_args()   
    
    verbose = args.verbose
    return args


if __name__ == "__main__":
    args  = parse_args()

    print "-----------------------------------------< taxmap web service >----"
    app.run(debug=True) # If running directly from the CLI, run in debug mode.