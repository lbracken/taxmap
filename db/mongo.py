# -*- coding: utf-8 -*-
"""
    taxmap.db.mongo
    ~~~~~~~~~~~~~~~~~~ 

    This module supports interaction with mongoDB.

    Usage: Call a get_<collection_name>() function to return a
    connection to a particular mongoDB collection.  The connection
    should he reused to limit the number of concurrent connections
    open to mongoDB.
    
    :license: MIT, see LICENSE for more details.
"""

import ConfigParser

import pymongo


# These values set from config file
db_host = None
db_port = None


def init_config():
    """ Read mongoDB connection settings from config file

    """
    global db_host, db_port

    config = ConfigParser.SafeConfigParser()
    config.read("settings.cfg")

    db_host = config.get("mongo", "db_host")
    db_port = config.getint("mongo", "db_port")  


def get_mongodb_connection(collection_name):
    print "  Connecting to mongoDB @ %s:%d   taxmapDB.%s" % \
            (db_host, db_port, collection_name)

    client = pymongo.MongoClient(db_host, db_port)
    return client["taxmapDB"][collection_name]


def get_regions_collection():
    collection = get_mongodb_connection("regions")
    collection.ensure_index("state_abbrv", 1)
    collection.ensure_index("type", 1)
    return collection


# Initialize config when loading module
init_config()