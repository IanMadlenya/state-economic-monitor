import csv
import xlrd
import xlwt
from collections import OrderedDict
import json
import time
import sys
from math import ceil
from datetime import datetime, timedelta

BASE = '/var/www/apps.urban.org/semApp/'

def convertDate(xldate):
  temp = datetime(1899, 12, 30)
  delta = timedelta(days=xldate)
  return temp+delta
print convertDate(39479)

def parseXlSX(fileName):
  sourceBook = xlrd.open_workbook(BASE + 'data/historical/source/' + fileName + ".xlsx")
  sheet = sourceBook.sheets()[0]
  with open(BASE + 'data/historical/source/sheets/{}_source.csv'.format(fileName), 'wb') as f:
    writer = csv.writer(f)
    for row in range(sheet.nrows):
      out = []
      for cell in sheet.row(row):
        # Check if type matches "XL_CELL_ERROR", or ctype == 5, see xlrd docs http://www.lexicon.net/sjmachin/xlrd.html
        if cell.ctype == 5:
        #Get the text representation of the error code from the xlrd dict that stores them
          value = xlrd.error_text_from_code[cell.value]
        elif cell.ctype == xlrd.XL_CELL_DATE:
          date = xlrd.xldate_as_tuple(cell.value, sourceBook.datemode)
          value = str(date[0]) + "-" + str(date[1]).zfill(2)
        else:
          value = cell.value
        if isinstance(value, float) or isinstance(value,int):
          out.append(value)
        else:
          out.append(value.encode('utf8'))
      writer.writerow(out)

def reshapeQuarterly(fileName):
  data = []    
  reader = csv.reader(open(BASE + "data/historical/source/sheets/%s_source.csv"%fileName, "rU"))
  head = reader.next()
  head = reader.next()
  head = reader.next()
  head = reader.next()

  for row in reader:
    data.append(row)
  outData = [["state"]]
  states=data[0]
  for i in range(2, len(states)):
      outData.append([states[i]])
  for r in range(1, len(data)):
    row = data[r]
    outData[0].append(str(int(float(row[0]))) + "-" + str(3*int(float(row[1]))).zfill(2))
  for r in range(1, len(data)):
    for i in range(2, len(states)):
      outData[i-1].append(data[r][i])
  with open(BASE + 'data/historical/{}.csv'.format(fileName), 'wb') as f:
    writer = csv.writer(f)
    for row in outData:
      if row[2] != "N/A":
        writer.writerow(row)
  with open(BASE + 'static/data/historical/{}.csv'.format(fileName), 'wb') as f:
    writer = csv.writer(f)
    for row in outData:
      if row[2] != "N/A":
        writer.writerow(row)

def reshapeMonthly(fileName):
  data = []    
  reader = csv.reader(open(BASE + "data/historical/source/sheets/%s_source.csv"%fileName, "rU"))
  head = reader.next()
  head = reader.next()
  head = reader.next()
  head = reader.next()
  
  for row in reader:
    data.append(row)
  outData = [["state"]]
  states=data[0]
  for i in range(1, len(states)):
      outData.append([states[i]])
  for r in range(1, len(data)):
    row = data[r]
    outData[0].append(row[0])
  for r in range(1, len(data)):
    for i in range(1, len(states)):
      outData[i].append(data[r][i])

  with open(BASE + 'data/historical/{}.csv'.format(fileName), 'wb') as f:
    writer = csv.writer(f)
    for row in outData:
      writer.writerow(row)
  with open(BASE + 'static/data/historical/{}.csv'.format(fileName), 'wb') as f:
    writer = csv.writer(f)
    for row in outData:
      writer.writerow(row)




# quarterly = ["housing_historical","state_total_tax_historical"]

quarterly = ["housing_historical","state_total_tax_values_historical","corp_historical","income_historical","sales_historical"]
monthly = ["total_employment_historical","gov_employment_historical","unemployment_historical","earnings_historical"]

for qFile in quarterly:
  parseXlSX(qFile)
  reshapeQuarterly(qFile)

for mFile in monthly:
  parseXlSX(mFile)
  reshapeMonthly(mFile)

