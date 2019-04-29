import csv
from geopy.geocoders import Nominatim
californiaMap = {"2000": {"rate": 0,"count":0},
            "2001": {"rate": 0,"count":0},
            "2002": {"rate": 0,"count":0},
            "2003": {"rate": 0,"count":0},
            "2004": {"rate": 0,"count":0},
            "2005": {"rate": 0,"count":0},
            "2006": {"rate": 0,"count":0},
            "2007": {"rate": 0,"count":0},
            "2008": {"rate": 0,"count":0},
            "2009": {"rate": 0,"count":0},
            "2010": {"rate": 0,"count":0},
            "2011": {"rate": 0,"count":0},
            "2012": {"rate": 0,"count":0},
            "2013": {"rate": 0,"count":0}
}

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
    			if(stratName == "Violent crime total"):
    			    g = float("{0:.2f}".format(g/4))
    			else:
    			    californiaMap[year]["rate"] += g
    			    californiaMap[year]["count"] += 1


    			writer.writerow([year, county, stratCode, stratName,nom,dom, g])

    for key in californiaMap:
        value = californiaMap[key]["rate"]/californiaMap[key]["count"]
        writer.writerow([key, "California", 10, "CaliAverage",0,0, value])

