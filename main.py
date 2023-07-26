# used for recieving the data of POST request
import sys
# used for sending the result to the middle end
import requests

# data from middle end(Javascript)
def main():
    print(sys.argv)

def send_result(data):
    url = '' # write the url on which Javascript is listening
    requests.post(url, json = data)

main()