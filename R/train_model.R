args <- commandArgs(trailingOnly = TRUE)
input_file <- if (length(args) >= 1) args[[1]] else "data/sample_meals.csv"
model_file <- if (length(args) >= 2) args[[2]] else "web/model.json"
prediction_file <- if (length(args) >= 3) args[[3]] else "data/predictions.csv"

if (!file.exists(input_file)) stop("Input dataset not found: ", input_file)
dir.create(dirname(model_file), recursive = TRUE, showWarnings = FALSE)
dir.create(dirname(prediction_file), recursive = TRUE, showWarnings = FALSE)

data <- read.csv(input_file, stringsAsFactors = FALSE)
required <- c("attendance", "popularity", "day_type", "holiday",
              "temperature", "rainfall", "consumed_kg", "wasted_kg")
missing <- setdiff(required, names(data))
if (length(missing) > 0) stop("Missing columns: ", paste(missing, collapse = ", "))

data$day_type <- factor(data$day_type, levels = c("Weekday", "Weekend"))
data$holiday <- factor(data$holiday, levels = c("No", "Yes"))
data$meal_type <- factor(data$meal_type, levels = c("Breakfast", "Lunch", "Dinner"))
consumption_model <- lm(consumed_kg ~ attendance + popularity + meal_type +
                          day_type + holiday + temperature + rainfall, data = data)
waste_model <- lm(wasted_kg ~ attendance + popularity + meal_type +
                    day_type + holiday + temperature + rainfall, data = data)

encode_coefficients <- function(model) {
  values <- coef(model)
  values[is.na(values)] <- 0
  paste(sprintf('"%s":%.10f', names(values), as.numeric(values)), collapse = ",")
}
rmse <- function(actual, predicted) sqrt(mean((actual - predicted)^2))
r2 <- function(actual, predicted) 1 - sum((actual - predicted)^2) /
  sum((actual - mean(actual))^2)

data$predicted_consumed_kg <- pmax(0, predict(consumption_model, newdata = data))
data$predicted_wasted_kg <- pmax(0, predict(waste_model, newdata = data))
data$waste_risk <- cut(data$predicted_wasted_kg,
                       breaks = c(-Inf, 7, 11, Inf),
                       labels = c("Low", "Moderate", "High"))
write.csv(data, prediction_file, row.names = FALSE)

model_json <- paste0(
  "{\n",
  '  "consumption": {', encode_coefficients(consumption_model), "},\n",
  '  "waste": {', encode_coefficients(waste_model), "},\n",
  '  "margin": 0.05,\n',
  '  "riskThresholds": {"low": 7, "high": 11},\n',
  '  "metrics": {',
  sprintf('"mae": %.4f, "rmse": %.4f, "r2": %.4f',
          mean(abs(data$consumed_kg - data$predicted_consumed_kg)),
          rmse(data$consumed_kg, data$predicted_consumed_kg),
          r2(data$consumed_kg, data$predicted_consumed_kg)),
  "},\n",
  '  "trainedRows": ', nrow(data), "\n",
  "}\n"
)
writeLines(model_json, model_file)
message("Model written to ", model_file)
message("Predictions written to ", prediction_file)
