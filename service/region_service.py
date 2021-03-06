# -*- coding: utf-8 -*-
"""
    taxmap.service.region_service
    ~~~~~~~~~~~~~~

    Module that provides region related services.
    
    :license: MIT, see LICENSE for more details.
"""
import json

from db import mongo

regions = None
zip2fips = None
zip2fips_file = "sources/other/zip2fips.json"


def init_db():
    global regions

    # Init DB
    regions = mongo.get_regions_collection()


def get_country():
    """ Will return data on the country

    """    
    query = {"type" : "country"}
    country_data = regions.find_one(query)
    return country_data


def get_states():
    """ Will return data on all regions of type state

    """
    query = {"type" : "state"}
    states = {"states" : []}

    for state in regions.find(query).sort("name"):
        states["states"].append(state)

    return states


def get_state(fips_code):
    """ Will return data on the state that the given FIPS code falls
        within.

    """
    query = {"type" : "state", "_id" : get_state_fips_code(fips_code)}
    state = regions.find_one(query)
    return state


def get_counties(fips_code):
    """ Will return data on all counties within state that the given
        FIPS code falls within.

    """
    state_abbrv = get_state_abbrv_for_fips(fips_code)
    query = {"type" : "county", "state_abbrv" : state_abbrv}
    counties = {"counties" : []}

    for county in regions.find(query).sort("name"):
        counties["counties"].append(county)

    return counties


def get_county(fips_code):
    """ Will return data on the county with the given FIPS code.

    """
    query = {"type" : "county", "_id" : fips_code}
    state_data = regions.find_one(query)
    return state_data


def determine_tax_map(zip, prgm_name, prgm_cost):

    fips_code = get_fips_code_from_zip(zip)

    resolution = None
    total_est_taxes = 0
    total_population = 0
    regions = []

    # Check if the cost of the program is larger than all of the taxes
    # paid within the country.  If so, just return data on the country.
    country = get_country()
    if prgm_cost >= country.get("est_taxes"):
        country["_id"] = "0"
        resolution = "country"
        total_est_taxes = country.get("est_taxes")
        total_population = country.get("population")
        regions.append(country)

    # Otherwise, check if the cost of the program is larger than all of
    # the taxes paid within the given state.  If so, then determine the
    # set of states that could sum up to the program cost.
    if not resolution:
        state = get_state(fips_code)

        if prgm_cost >= state.get("est_taxes"):
            resolution = "state"
            regions.append(state)
            total_est_taxes += state.get("est_taxes")
            total_population += state.get("population")    

            # Iterate over the other states until the sum of their
            # taxes matches or exceeds the program cost
            idx = 0            
            states = get_states().get("states")
            while total_est_taxes < prgm_cost:

                # TODO: Iterate through adjacent states first...
                regions.append(states[idx])
                total_est_taxes += states[idx].get("est_taxes")
                total_population += states[idx].get("population")
                idx += 1

    # Otherwise, determine the set of counties whose taxes sum up to
    # the program cost
    if not resolution:
        county = get_county(fips_code)

        resolution = "county"
        regions.append(county)
        total_est_taxes += county.get("est_taxes")
        total_population += county.get("population")

        if prgm_cost > total_est_taxes:

            # Iterate over the other counties until the sum of their
            # taxes matches or exceeds the program cost
            idx = 0            
            counties = get_counties(fips_code).get("counties")
            while total_est_taxes < prgm_cost:

                # TODO: Iterate through adjacent counties first...
                regions.append(counties[idx])
                total_est_taxes += counties[idx].get("est_taxes")
                total_population += counties[idx].get("population")
                idx += 1

    # Build an index of regions to enable quick lookups client-side
    regions_idx = {}
    idx = 0
    for region in regions:
        regions_idx[int(region.get("_id"))] = idx
        idx += 1

    return {
        "zip" : zip,
        "prgm_name" : prgm_name,
        "fips_code" : fips_code,
        "prgm_cost" : prgm_cost,
        "resolution" : resolution,
        "total_est_taxes" : total_est_taxes,
        "total_population" : total_population,
        "regions" : regions,
        "regions_idx" : regions_idx
        # Consider adding other info here, like AGI...
    }


def get_state_fips_code(fips_code):
    """ Returns the FIPS code of the state that the given fips_code
        belongs in.   The first two chars of the fips code indicate the
        state.

    """
    return fips_code[:2] + "000"


def get_state_abbrv_for_fips(fips_code):
    """ Returns the abbreviation of the state that the given fips_code
        =belongs in.

    """
    # TODO: A DB call currently takes place, this should just be a
    # a simple in-memory lookup...
    return get_state(fips_code).get("state_abbrv")


def get_fips_code_from_zip(zip):
    global zip2fips

    if not zip2fips:
        # If zip2fips hasnt' been initialized then read it from a file
        json_data = open(zip2fips_file)
        zip2fips = json.load(json_data)

    return zip2fips.get(zip)


# Initialize connection to DB when loading module
init_db()