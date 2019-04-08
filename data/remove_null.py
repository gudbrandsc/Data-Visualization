import csv


with open('./hci_crime_752_pl_co_re_ca_2000-2013_21oct15.csv', 'r') as inp, open('newData.csv', 'w') as out_2018:
    writer = csv.writer(out_2018)
    header = 0
    for row in csv.reader(inp):
    	if header == 0:
    		writer.writerow(row)
    		header = 1
    	else:
    		if row[15] != "Jurisdiction does not report" and row[9] != '':
		    		writer.writerow(row)
		    
         