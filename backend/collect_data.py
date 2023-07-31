# This library is used to get html of the website
import requests
# bs4 is necessary to analyze the html
from bs4 import BeautifulSoup
# json library
import json
# csv file library
import csv

def main():
    active_shooters()

def active_shooters():
    # load data from csv
    data = []
    with open("C:\\Users\\Student\\Desktop\\WatasuM\\GatherDisasterData\\active_shooter.csv", "r") as f:
        for row in list(csv.reader(f, delimiter=",")):
            if row[2] == "California":
                data.append(
                    {
                        "DATETIME": row[1],
                        "ADDRESS": row[4],
                        "VICTIMS_KILLED": row[5],
                        "VICTIMS_INJURED": row[6]
                    }
                )
    print(len(data))

def earthquakes():
    # get html
    url = "https://scedc.caltech.edu/recent/Quakes/quakes0.html"
    r = requests.get(url)
    html = r.text
    soup = BeautifulSoup(html, 'html.parser')
    # data box
    data = []

    # analyze for each rows
    rows = soup.find_all('tr')[1:]
    for row in rows:
        columns = row.find_all('td')
        data.append(
            {
                "MAG": columns[1].text,
                "DATETIME": columns[2].text,
                "LAT": columns[3].text,
                "LON": columns[4].text,
                "DEPTH": columns[5].text
            }
        )

    # data with json format
    json_data = {"earthquakes": data, "active shooter": ""}
    with open("C:\\Users\\Student\\Desktop\\WatasuM\\disaster_data.json", "w") as f:
        f.write(json.dumps(json_data))

# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    main()