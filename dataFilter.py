import csv
from geopy.geocoders import Nominatim

with open('Crime_Data_from_2010_to_Present.csv', 'r') as inp, open('gudbrnad3.csv', 'w') as out_2018:
    writer = csv.writer(out_2018)
    header = 0
    geolocator = Nominatim(user_agent="dataFitler")
    for row in csv.reader(inp):
    	if header == 0:
    		writer.writerow(['Date Occurred', 'Latitude', 'Longitude', 'State', 'City', "District"])
    		header = 1
    	else:
    		point=row[25].split(',')
    		lat = point[0][1:]
    		ltude = point[1][:-1]
    		location = geolocator.reverse(str(lat) + "," + str(ltude))
    		address = location.address.split(',')
    		writer.writerow([row[2],lat, ltude, 'California', 'Los Angeles', address[3]])


         