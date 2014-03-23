# -*- coding: utf-8 -*-
"""
    taxmap.import.import_irs_data
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Module that will import various data from the IRS into mongoDB.

    :license: MIT, see LICENSE for more details.
"""

import argparse
import os
import sys

from db import mongo

verbose = False
regions = None

# IRS money amounts are in thousands of dollars
multiplier = 1000


def init_db():
    global regions

    # Init DB
    regions = mongo.get_regions_collection()


def import_county_income_data(filename):
    
    print "Loading IRS county income data from '%s'" % filename
    fin = open(filename, 'r')
    regions_count = 0

    # Skip header row
    next(fin)

    for line in fin:
        columns = line.strip().split(",")

        fips_code = determine_fips_code(columns[0], columns[1])
        region = {
            "state_abbrv" : columns[2].strip().lower(),
            "name"        : sanitize_name(columns[3]),
            "num_returns"    : int(columns[4]),
            "num_exemptions" : int(columns[5]),
            "agi"       : int(columns[6]) * multiplier,
            "wages"     : int(columns[7]) * multiplier,
            "dividends" : int(columns[8]) * multiplier,
            "interest"  : int(columns[9]) * multiplier
        }
        
        # Upsert into the DB
        regions.update(
            {"_id" : fips_code},
            {"$set": region},
            upsert=True)

        regions_count += 1
        if verbose:
            print "%d) Region: %s (%s)\tAGI: %d" % (regions_count,\
                    fips_code, region["name"], region["agi"])

    # Set country information
    regions.update(
        {"type" : "country"},
        {"$set" : {"name" : "United States of America"}})

    print "... data for %d regions was imported" % regions_count


def sanitize_name(name):
    #name u(name).encode('utf-8')
    return name.lower().replace("county", "").strip()


def determine_fips_code(state_code, county_code):

    # Ensure state code is 2-digits and county code is 3-digits
    state_code = state_code if len(state_code) > 1 else "0" + state_code
    county_code = county_code if len(county_code) > 1 else "0" + county_code
    county_code = county_code if len(county_code) > 2 else "0" + county_code
    return state_code + county_code


def parse_args():
    """ Parse the command line arguments

    """
    global verbose

    parser = argparse.ArgumentParser(description="Reads census data \
        and imports into DB.")
    parser.add_argument("-v", "--verbose", action='store_true',
            help="Make the operation talkative")
    parser.add_argument("-f", "--filename", help="File to parse")
    args = parser.parse_args()   
    
    verbose = args.verbose
    return args


if __name__ == "__main__":
    args  = parse_args()  

    print "-------------------------------------------< import_irs_data >----"
    init_db()

    if args.filename:
        import_county_income_data(args.filename.strip())
    else:
        print "No filename provided"