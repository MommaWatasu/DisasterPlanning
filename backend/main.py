import numpy as np
import scipy as sp
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

def load_data():
    data = np.genfromtxt('../data/erathquake.csv', delimiter=',')
    print(data)

def main():
    load_data()
    model = model = Sequential(
        [
            Dense(10, activation="relu"),
            Dense(20, activation="relu"),
            Dense(10, activation="tanh"),
            Dense(2),
        ]
    )


if __name__ == '__main__':
    main()