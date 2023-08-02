model = Chain(
        Dense(3=>10, relu),
        Dense(10=>20, relu),
        Dense(20=>10, relu),
        # output layer
        Dense(10=>3)
    )
This model predicts the latitude, longitude, depth.