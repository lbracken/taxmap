#!/bin/bash
# Script to run imports on all data

python -m import.import_census_data -vf sources/census/DataSet.txt
python -m import.import_irs_data -vf sources/irs/09incicsv.csv

python -m calculate_taxes_paid -v