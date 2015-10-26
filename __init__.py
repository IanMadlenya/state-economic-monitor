# from flask import render_template, Flask, url_for

# app = Flask(__name__)

# @app.route('/hello')
# def hello(name=None):
#   url_for('static', filename='testTags.js')
#   return render_template('search.html')


import csv
import json
from shutil import copy2
from subprocess import call
import re
import fileinput
import os
from flask import Flask, jsonify, render_template, request, session, redirect, current_app
from pdfkit import from_url, from_file
app = Flask(__name__)
from math import ceil


@app.route("/upload", methods=["POST", "GET"])
def upload():
  if request.method == 'POST':
      file = request.files['file']
      sheet = request.args.get('sheet', '', type=str)
      if file:
          filename = file.filename
          file.save(os.path.join("/var/www/apps.urban.org/semApp/data/source/", filename))

  # file = request.files['file']
  # sheet = request.args.get('sheet', '', type=str)
  # # print sheet
  # file.save("/var/www/apps.urban.org/semApp/data/source/" + "current_" + sheet + ".xlsx")
  # copy2("/var/www/apps.urban.org/semApp/data/source/" + "current_" + sheet + ".xlsx", "data/source/previous_releases/" + file.filename)
  return ""

@app.route('/add', methods=["POST", "GET"])
def update_SEM():
  # new_config = {}
  figures = [["wages",["AWW","AWWChg"]], ["employment",["UNEMP", "Figure1", "EMP", "Figure2"]], ["housing",["HPChgYr","Figure3"]], ["taxes",["TOTAL","INC","CORPINC","SALES"]]]
  with open('/var/www/apps.urban.org/semApp/static/config.json') as config_file:
    old_config = json.load(config_file)
  new_config = request.json
  config_file.close()
  # return redirect("/upload")
  # amount = request.args.get('amount', '', type=str)

  def replaceText(old, new):
    for line in fileinput.input("/var/www/apps.urban.org/semApp/wages.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line
    for line in fileinput.input("/var/www/apps.urban.org/semApp/templates/wages_preview.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line
    for line in fileinput.input("/var/www/apps.urban.org/semApp/pdf/templates/wages_pdf.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line

    for line in fileinput.input("/var/www/apps.urban.org/semApp/employment.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line
    for line in fileinput.input("/var/www/apps.urban.org/semApp/templates/employment_preview.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line
    for line in fileinput.input("/var/www/apps.urban.org/semApp/pdf/templates/employment_pdf.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line

    for line in fileinput.input("/var/www/apps.urban.org/semApp/housing.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line
    for line in fileinput.input("/var/www/apps.urban.org/semApp/templates/housing_preview.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line
    for line in fileinput.input("/var/www/apps.urban.org/semApp/pdf/templates/housing_pdf.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line

    for line in fileinput.input("/var/www/apps.urban.org/semApp/taxes.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line
    for line in fileinput.input("/var/www/apps.urban.org/semApp/templates/taxes_preview.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line
    for line in fileinput.input("/var/www/apps.urban.org/semApp/pdf/templates/taxes_pdf.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line

  def replaceBreaks(figure, new):
    matched = False
    for line in fileinput.input("/var/www/apps.urban.org/semApp/js/semConfig.js", inplace=1):
      if re.search('\"' + figure + '\".*\{', line):
        matched = True
      if re.search('\"breaks\"', line) and matched:
        line = re.sub(r'(.*)(\[.*\])(.*)',r'\1[' + ','.join(map(str,new)) + r']\3',line)
        matched = False
      print(line.rstrip())

    matched = False
    for line in fileinput.input("/var/www/apps.urban.org/semApp/static/js/semConfig.js", inplace=1):
      if re.search('\"' + figure + '\".*\{', line):
        matched = True
      if re.search('\"breaks\"', line) and matched:
        line = re.sub(r'(.*)(\[.*\])(.*)',r'\1[' + ','.join(map(str,new)) + r']\3',line)
        matched = False
      print(line.rstrip())

  def replaceDate(old, new):
    for line in fileinput.input("/var/www/apps.urban.org/semApp/index.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line
    for line in fileinput.input("/var/www/apps.urban.org/semApp/templates/index_preview.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print line    
  def quarter(month):
      q = ceil(float(month)/3.0)
      return 'Q' + str(int(q))

  replaceDate(old_config["dateUpdated"], new_config["dateUpdated"])
  for fig in figures:
    sheet = fig[0]
    for figure in fig[1]:
      replaceText(old_config[sheet][figure]["text"], new_config[sheet][figure]["text"])
      if "breaks" in new_config[sheet][figure]:
        replaceBreaks(figure, new_config[sheet][figure]["breaks"])

  f=open("/var/www/apps.urban.org/semApp/static/config.json",'w')
  f.write(json.dumps(new_config, indent=4, sort_keys=True).encode("utf8"))
  f.close();
  
  os.system("/usr/bin/python /var/www/apps.urban.org/semApp/reshape_data.py " + new_config["employment"]["date"] + " " + new_config["taxes"]["date"] + " " + new_config["wages"]["date"] + " " + new_config["housing"]["date"])

  # os.system("http-server")
  dates = [("",""),("Jan", "January"), ("Feb", "February"), ("Mar","March"),("Apr","April"),("May","May"),("June","June"),("Jul","July"),("Aug","August"),("Sept","September"),("Oct","October"),("Nov","November"),("Dec","December")]


  # os.system("/usr/bin/depict http://sem.urban.org/employment.html -s '#figure_unemployment' -d 500 /var/www/apps.urban.org/semApp/pdf/images/figure_unemployment.png")
  # os.system("/usr/bin/depict http://sem.urban.org/employment.html -s '#figure_level_vs_change_unemployment' -d 500 /var/www/apps.urban.org/semApp/pdf/images/figure_level_vs_change_unemployment.png")
  # os.system("/usr/bin/depict http://sem.urban.org/employment.html -s '#figure_nonfarm-employment' -d 500 /var/www/apps.urban.org/semApp/pdf/images/figure_nonfarm-employment.png")
  # os.system("/usr/bin/depict http://sem.urban.org/employment.html -s '#total_change_emp_vs_public_change_emp' -d 500 /var/www/apps.urban.org/semApp/pdf/images/total_change_emp_vs_public_change_emp.png")
  empName = dates[int(new_config["employment"]["date"].split("/")[0])][0] + new_config["employment"]["date"][-2:]
  fullempName = dates[int(new_config["employment"]["date"].split("/")[0])][1] + " \'" + new_config["employment"]["date"][-2:]
 # from_file('/var/www/apps.urban.org/semApp/pdf/templates/employment_pdf.html', '/var/www/apps.urban.org/semApp/archive/employment%s.pdf'%empName, css = "/var/www/apps.urban.org/semApp/css/sem.css")

  if new_config["employment"]["date"] != old_config["employment"]["date"]:
    oldArchive = "<!-- NEW EMPLOYMENT HERE -->"
    newArchive = oldArchive + "\n" \
    + "<li class=\"archiveMonth\"><a href=\"archive/employment" + empName\
    + ".pdf\" target=\"_blank\">" + fullempName\
    +"</a></li>"
    for line in fileinput.input("/var/www/apps.urban.org/semApp/archive.html", inplace=1):
      line = line.replace(oldArchive.encode("utf8"), newArchive.encode("utf8")).rstrip()
      print line
    newPreview = oldArchive + "\n" \
    + "<li class=\"archiveMonth\"><a href=\"http://sem.urban.org/archive/employment" + empName\
    + ".pdf\" target=\"_blank\">" + fullempName\
    +"</a></li>"
    for line in fileinput.input("/var/www/apps.urban.org/semApp/templates/archive_preview.html", inplace=1):
      line = line.replace(oldArchive.encode("utf8"), newPreview.encode("utf8")).rstrip()
      print line


  # os.system("/usr/bin/depict http://sem.urban.org/wages.html -s '#figure_wages' -d 500 /var/www/apps.urban.org/semApp/pdf/images/figure_wages.png")
  # os.system("/usr/bin/depict http://sem.urban.org/wages.html -s '#figure_wages-change' -d 500 /var/www/apps.urban.org/semApp/pdf/images/figure_wages-change.png")
  wageName = dates[int(new_config["wages"]["date"].split("/")[0])][0] + new_config["wages"]["date"][-2:]
  fullwageName = dates[int(new_config["wages"]["date"].split("/")[0])][1] + " \'" + new_config["wages"]["date"][-2:]
 # from_file('pdf/templates/wages_pdf.html', 'archive/wages%s.pdf'%wageName, css = "/var/www/apps.urban.org/semApp/css/sem.css")
  os.system("/usr/bin/depict http://sem.urban.org/wages.html -H .pdfhide /var/www/apps.urban.org/semApp/archive/wages" +wageName+ ".pdf")
  if new_config["wages"]["date"] != old_config["wages"]["date"]:
    oldArchive = "<!-- NEW WAGES HERE -->"
    newArchive = oldArchive + "\n" \
    + "<li class=\"archiveMonth\"><a href=\"archive/wages" + wageName\
    + ".pdf\" target=\"_blank\">" + fullwageName\
    +"</a></li>"
    for line in fileinput.input("archive.html", inplace=1):
      line = line.replace(oldArchive.encode("utf8"), newArchive.encode("utf8")).rstrip()
      print line
    newPreview = oldArchive + "\n" \
    + "<li class=\"archiveMonth\"><a href=\"http://sem.urban.org/archive/wages" + wageName\
    + ".pdf\" target=\"_blank\">" + fullwageName\
    +"</a></li>"
    for line in fileinput.input("templates/archive_preview.html", inplace=1):
      line = line.replace(oldArchive.encode("utf8"), newPreview.encode("utf8")).rstrip()
      print line



  housingName = quarter(int(new_config["housing"]["date"].split("/")[0])) + new_config["housing"]["date"][-2:]
  fullhousingName = quarter(int(new_config["housing"]["date"].split("/")[0])) + " \'" + new_config["housing"]["date"][-2:]
  os.system("/usr/bin/depict http://sem.urban.org/housing.html -s '#figure_house-prices' -d 500 /var/www/apps.urban.org/semApp/pdf/images/figure_house-prices.png")
  os.system("/usr/bin/depict http://sem.urban.org/housing.html -s '#housing_change_vs_2007_housing_change' -d 500 /var/www/apps.urban.org/semApp/pdf/images/housing_change_vs_2007_housing_change.png")
 # from_file('pdf/templates/housing_pdf.html', 'archive/housing%s.pdf'%housingName, css = "/var/www/apps.urban.org/semApp/css/sem.css")
  if new_config["housing"]["date"] != old_config["housing"]["date"]:
    oldArchive = "<!-- NEW HOUSING HERE -->"
    newArchive = oldArchive + "\n" \
    + "<li class=\"archiveMonth\"><a href=\"archive/housing" + housingName\
    + ".pdf\" target=\"_blank\">" + fullhousingName\
    +"</a></li>"
    for line in fileinput.input("archive.html", inplace=1):
      line = line.replace(oldArchive.encode("utf8"), newArchive.encode("utf8")).rstrip()
      print line
    newPreview = oldArchive + "\n" \
    + "<li class=\"archiveMonth\"><a href=\"http://sem.urban.org/archive/housing" + housingName\
    + ".pdf\" target=\"_blank\">" + fullhousingName\
    +"</a></li>"
    for line in fileinput.input("templates/archive_preview.html", inplace=1):
      line = line.replace(oldArchive.encode("utf8"), newPreview.encode("utf8")).rstrip()
      print line


  # os.system("/usr/bin/depict http://sem.urban.org/taxes.html -s '#figure_total-taxes' -d 500 /var/www/apps.urban.org/semApp/pdf/images/figure_total-taxes.png")
  # os.system("/usr/bin/depict http://sem.urban.org/taxes.html -s '#figure_sales-taxes' -d 500 /var/www/apps.urban.org/semApp/pdf/images/figure_sales-taxes.png")
  # os.system("/usr/bin/depict http://sem.urban.org/taxes.html -s '#figure_income-taxes' -d 500 /var/www/apps.urban.org/semApp/pdf/images/figure_income-taxes.png")
  # os.system("/usr/bin/depict http://sem.urban.org/taxes.html -s '#figure_corporate-taxes' -d 500 /var/www/apps.urban.org/semApp/pdf/images/figure_corporate-taxes.png")
  taxesName = quarter(int(new_config["housing"]["date"].split("/")[0])) + new_config["housing"]["date"][-2:]
  fulltaxesName = quarter(int(new_config["taxes"]["date"].split("/")[0])) + " \'" + new_config["taxes"]["date"][-2:]
  from_file('/var/www/apps.urban.org/semApp/pdf/templates/taxes_pdf.html', 'archive/taxes/TESTTESTES.pdf')  
#from_file('/var/www/apps.urban.org/semApp/pdf/templates/taxes_pdf.html', 'archive/taxes%s.pdf'%taxesName, css = "/var/www/apps.urban.org/semApp/css/sem.css")
  if new_config["taxes"]["date"] != old_config["taxes"]["date"]:
    oldArchive = "<!-- NEW TAXES HERE -->"
    newArchive = oldArchive + "\n" \
    + "<li class=\"archiveMonth\"><a href=\"archive/taxes" + taxesName\
    + ".pdf\" target=\"_blank\">" + fulltaxesName\
    +"</a></li>"
    for line in fileinput.input("/var/www/apps.urban.org/semApp/archive.html", inplace=1):
      line = line.replace(oldArchive.encode("utf8"), newArchive.encode("utf8")).rstrip()
      print line
    newPreview = oldArchive + "\n" \
    + "<li class=\"archiveMonth\"><a href=\"http://sem.urban.org/archive/taxes" + taxesName\
    + ".pdf\" target=\"_blank\">" + fulltaxesName\
    +"</a></li>"
    for line in fileinput.input("/var/www/apps.urban.org/semApp/templates/archive_preview.html", inplace=1):
      line = line.replace(oldArchive.encode("utf8"), newPreview.encode("utf8")).rstrip()
      print line


  return jsonify({})

@app.route('/')
def index():
  return render_template('update.html')
@app.route('/preview')
def preview():
  return render_template('index_preview.html')
@app.route('/employment.html')
def employment():
  return render_template('employment_preview.html')
@app.route('/wages.html')
def wages():
  return render_template('wages_preview.html')
@app.route('/taxes.html')
def taxes():
  return render_template('taxes_preview.html')
@app.route('/housing.html')
def housing():
  return render_template('housing_preview.html')  
@app.route('/archive.html')
def archive():
  return render_template('archive_preview.html')  
@app.route('/index.html')
def index_preview():
  return render_template('index_preview.html')


if __name__ == '__main__':
  app.debug = True
  app.run(threaded=True)
