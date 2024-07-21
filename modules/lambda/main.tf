terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_lambda_function" "kinesis_to_clickhouse" {
  filename      = "lambda_function.zip"
  function_name = "kinesis-to-clickhouse-dev"
  role          = aws_iam_role.lambda_role.arn
  description   = "handler function for sending kinesis data to clickhouse"
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.12"
  # publish       = true

  source_code_hash = filebase64sha256("lambda_function.zip")
  timeout       = 60

  environment {
    variables = {
      CLICKHOUSE_HOST = var.clickhouse_public_ip
      CLICKHOUSE_PORT = "8123"
    }
  }

  layers = [
    aws_lambda_layer_version.layer_content.arn
  ]

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
}

resource "aws_security_group" "lambda_sg" {
  name        = "lambda-security-group"
  description = "Security group for Lambda function"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# resource "aws_lambda_event_source_mapping" "kinesis_trigger" {
#   event_source_arn  = "arn:aws:kinesis:us-west-1:767397811841:stream/MyKinesisDataStream"
#   function_name     = aws_lambda_function.kinesis_to_clickhouse.arn
#   starting_position = "LATEST"
#   batch_size        = 3
#   enabled           = true
# }

resource "aws_iam_policy" "lambda_layer_policy" {
  name        = "lambda_layer_policy"
  path        = "/"
  description = "IAM policy for Lambda layer creation"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:PublishLayerVersion",
          "lambda:GetLayerVersion",
          "lambda:DeleteLayerVersion"
        ]
        Resource = "arn:aws:lambda:us-west-1:659377685669:layer:*"
      }
    ]
  })
}

resource "aws_iam_role" "lambda_role" {
  name = "lambda_execution_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_layer_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_layer_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_iam_role_policy_attachment" "kinesis_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaKinesisExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_iam_role_policy_attachment" "dynamodb_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_lambda_layer_version" "layer_content" {
  filename   = "layer_content.zip"
  layer_name = "layer_content"

  compatible_runtimes = ["python3.12"]
}

# resource "aws_lambda_layer_version" "dotenv" {
#   filename   = "dotenv-5d44c573-0872-4ac3-bdc7-c9be6be9eea9.zip"
#   layer_name = "dotenv"

#   compatible_runtimes = ["python3.12"]
# }




# pip install python-dotenv -t ./dotenv/python/lib/python3.12/site-packages/
# pip install clickhouse-connect -t ./clickhouse-connect/python/lib/python3.12/site-packages/
# pip install boto3 -t ./boto3/python/lib/python3.12/site-packages/

# zip -r dotenv_layer.zip ./dotenv
# zip -r clickhouse_connect_layer.zip ./clickhouse-connect
# zip -r boto3_layer.zip ./boto3

# zip -r lambda_function.zip lambda_function.py

{
    "message": "Request failed with status code 500",
    "name": "AxiosError",
    "stack": "AxiosError: Request failed with status code 500\n    at Wm (http://54.176.4.101:5000/assets/index-C6HJGnDe.js:77:1030)\n    at XMLHttpRequest.d (http://54.176.4.101:5000/assets/index-C6HJGnDe.js:77:5874)\n    at Bn.request (http://54.176.4.101:5000/assets/index-C6HJGnDe.js:79:1952)\n    at async Object.C_ [as inferSchema] (http://54.176.4.101:5000/assets/index-C6HJGnDe.js:80:63577)\n    at async k (http://54.176.4.101:5000/assets/index-C6HJGnDe.js:80:80554)",
    "config": {
        "transitional": {
            "silentJSONParsing": true,
            "forcedJSONParsing": true,
            "clarifyTimeoutError": false
        },
        "adapter": [
            "xhr",
            "http",
            "fetch"
        ],
        "transformRequest": [
            null
        ],
        "transformResponse": [
            null
        ],
        "timeout": 0,
        "xsrfCookieName": "XSRF-TOKEN",
        "xsrfHeaderName": "X-XSRF-TOKEN",
        "maxContentLength": -1,
        "maxBodyLength": -1,
        "env": {},
        "headers": {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json"
        },
        "method": "post",
        "url": "/api/kinesis-sample",
        "data": "{\"streamName\":\"Clickstream\"}"
    },
    "code": "ERR_BAD_RESPONSE",
    "status": 500
}