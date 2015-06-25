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
app = Flask(__name__)

@app.route("/upload", methods=["POST", "GET"])
def upload():
  file = request.files['file']
  sheet = request.args.get('sheet', '', type=str)
  file.save("data/source/" + "current_" + sheet + ".xlsx")
  copy2("data/source/" + "current_" + sheet + ".xlsx", "data/source/previous_releases/" + file.filename)
  return ""

@app.route('/add', methods=["POST", "GET"])
def update_SEM():
  # new_config = {}
  figures = [["wages",["AWW","AWWChg"]]]
  with open('static/config.json') as config_file:
    old_config = json.load(config_file)
  new_config = request.json
  config_file.close()
  # amount = request.args.get('amount', '', type=str)

  def replaceText(old, new):
    for line in fileinput.input("wages.html", inplace=1):
      line = line.replace(old.encode("utf8"), new.encode("utf8")).rstrip()
      print(line)

  def replaceBreaks(figure, new):
    matched = False
    for line in fileinput.input("js/semConfig.js", inplace=1):
      # line = re.sub("(\"AWW\".*)\n.*\"id", "foo", line.rstrip(), flags=re.DOTALL)
      if re.search('\"' + figure + '\".*\{', line):
        matched = True
      if re.search('\"breaks\"', line) and matched:
        line = re.sub(r'(.*)(\[.*\])(.*)',r'\1[' + ','.join(map(str,new)) + r']\3',line)
        matched = False
      print(line.rstrip())

  for fig in figures:
    sheet = fig[0]
    for figure in fig[1]:
      replaceText(old_config[sheet][figure]["text"], new_config[sheet][figure]["text"])
      replaceBreaks(figure, new_config[sheet][figure]["breaks"])

  f=open("static/config.json",'w')
  f.write(json.dumps(new_config, indent=4, sort_keys=True).encode("utf8"))
  f.close();
  
  # os.system("python reshape_data.py 05/2015 02/2011 " + new_config["wages"]["date"] + " 01/2000")
  return jsonify({})

@app.route('/')
def index():
  return render_template('update.html')

if __name__ == '__main__':
  app.debug = True
  app.run()