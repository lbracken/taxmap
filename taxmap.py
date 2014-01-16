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

app = Flask(__name__)
verbose = False


@app.route("/")
def main_page():
    return render_template("index.html")


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