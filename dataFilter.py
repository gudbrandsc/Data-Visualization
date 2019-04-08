import csv
from geopy.geocoders import Nominatim

with open('./data/newData.csv', 'r') as inp, open('gudbrnad3.csv', 'w') as out_2018:
    writer = csv.writer(out_2018)
    header = 0
    for row in csv.reader(inp):
    	if header == 0:
    		writer.writerow(['reportyear', 'county_name','strata_level_name_code', 'strata_level_name', 'numerator', 'denominator', 'rate'])
    		header = 1
    	else:
    		header += 1
    		if ((row[16] != '') and (row[17] != '')):
    			nom = int(row[16])
    			dom = int(row[17])
    			rate = (nom/dom)*1000
    			county = row[9]   
    			stratName = row[15]
    			stratCode = row[14]
    			year = row[2]

    			g = float("{0:.2f}".format(rate))


    			writer.writerow([year, county, stratCode, stratName,nom,dom, g])


         