# -*- coding: utf-8 -*-
"""
    taxmap.calculate_taxes_paid
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Module that will calculate an estimate of the taxes paid for each
    region.

    :license: MIT, see LICENSE for more details.
"""

import argparse

from db import mongo

verbose = False
regions = None

def init_db():
    global regions

    # Init DB
    regions = mongo.get_regions_collection()


def calculate_taxes_paid():

    """ To start, use a weak model for estimating taxes.  
        From the total individual income taxes paid, and the tota AGI
        for all counties, determine the average tax rate paid. Use
        that value to estimate the amount of taxes paid by a county's
        AGI. Obviously this doesn't take into account various tax 
        brackets and other factors.
    """

    # From 2009 TaxPolicy Center Data
    total_indiv_income_taxes_paid = 915308000000

    # Figure out the total AGI for all counties
    total_agi = regions.aggregate([
        {"$match" : {"type" : "county"}},      
        {"$project" : {
            "type" : "$type",
            "agi"  : "$agi"
        }},
        {"$group" : {
            "_id" : "$type",
            "total_agi" : {"$sum" : "$agi"}
        }},
        {"$sort" : {"_id" : 1}}
    ]).get("result")[0].get("total_agi")

    # Determine the average tax rate
    average_tax_rate = float(total_indiv_income_taxes_paid) / float(total_agi)

    print "  Income Taxes Paid: %d" % total_indiv_income_taxes_paid
    print "  Total AGI:         %d" % total_agi
    print "  Average Tax Rate:  %f" % average_tax_rate

    # Iterate over each region in the DB and estimate the taxes paid.
    # (Do the iteration over each element now even though the
    # calculation is simple).
    for region in regions.find().sort("_id"):

        est_taxes = 0
        agi = region.get("agi")
        fips_code = region.get("_id")
        region_type = region.get("type")

        if region_type == "usa":
            agi = 0
            est_taxes = total_indiv_income_taxes_paid

        elif region_type == "state" or region_type == "county":
            est_taxes = agi * average_tax_rate

        print "    * %s\tAGI:%d\tTaxes:%f" % (fips_code, agi, est_taxes)

        regions.update(
            {"_id" : fips_code},
            {"$set": {"est_taxes" : est_taxes}})


def parse_args():
    """ Parse the command line arguments

    """
    global verbose

    parser = argparse.ArgumentParser(description="Calculate taxes paid for \
        each region")
    parser.add_argument("-v", "--verbose", action='store_true',
            help="Make the operation talkative")
    args = parser.parse_args()   
    
    verbose = args.verbose
    return args


if __name__ == "__main__":
    args  = parse_args()  

    print "---------------------------------------< calculate_taxes_paid >----"
    init_db()
    calculate_taxes_paid()