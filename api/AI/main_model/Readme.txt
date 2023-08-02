model = Chain(
        Dense(3=>10, relu),
        Dropout(0.2),
        Dense(10=>20, relu),
        Dense(20=>30, relu),
        Dense(30=>20, relu),
        Dense(20=>10, relu),
        # output layer
        Dense(10=>2)
    )
This model predicts the hour and magunitude