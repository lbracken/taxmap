# -*- coding: utf-8 -*-
"""
    taxmap.import.import_census_data
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Module that will import various data from the Census Bureau into
    mongoDB.

    :license: MIT, see LICENSE for more details.
"""

import argparse
import os
import sys

from db import mongo

verbose = False
regions = None


def init_db():
    global regions

    # Init DB
    regions = mongo.get_regions_collection()


def import_quickfacts_data(filename):
    
    print "Importing Census QuickFacts data from '%s'" % filename
    fin = open(filename, 'r')
    regions_count = 0

    # Skip header row
    next(fin)

    for line in fin:
        columns = line.strip().split(",")

        # Data row format is: FIPS_CODE, ...., POPULATION, ...
        fips_code = columns[0]
        region = {
            # 2013 Population is listed in column:2
            "population" : int(columns[2]),
            "type" : determine_region_type(fips_code)
        }

        # Upsert into the DB
        regions.update(
            {"_id" : fips_code},
            {"$set": region},
            upsert=True)

        regions_count += 1
        if verbose:
            print "%d) Region: %s (%s)\tPop: %d" % (regions_count,\
                    fips_code, region["type"], region["population"])

    print "... data for %d regions was imported" % regions_count


def determine_region_type(fips_code):

    fips_code_int = int(fips_code)

    if fips_code_int == 0:
        return "country"
    elif fips_code_int % 1000 == 0:
        return "state"

    return "county"


def parse_args():
    """ Parse the command line arguments

    """
    global verbose

    parser = argparse.ArgumentParser(description="Reads census data \
        and imports into DB.")
    parser.add_argument("-v", "--verbose", action='store_true',
            help="Make the operation talkative")
    parser.add_argument("-f", "--filename", help="File to import")
    args = parser.parse_args()   
    
    verbose = args.verbose
    return args


if __name__ == "__main__":
    args  = parse_args()  

    print "-----------------------------------------< import_census_data >----"
    init_db()

    if args.filename:
        import_quickfacts_data(args.filename.strip())
    else:
        print "No filename provided"