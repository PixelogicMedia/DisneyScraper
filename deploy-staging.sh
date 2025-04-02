#!/bin/bash

# Check if the 'sam' command is available
if ! command -v sam &> /dev/null; then
    echo "The 'sam' command was not found. Please ensure it is installed and in the PATH."
    exit 1
fi

# Execute the 'sam build' command
echo "Running 'sam build'..."
sam build --config-file ./configs/samconfig-staging.toml

# Check the status of the last command
if [ $? -ne 0 ]; then
    echo "'sam build' failed. Exiting."
    exit 1
fi

# Execute the 'sam deploy' command
echo "Running 'sam deploy'..."
sam deploy --config-file /configs/samconfig-staging.toml

# Check the status of the last command
if [ $? -ne 0 ]; then
    echo "'sam deploy' failed. Exiting."
    exit 1
fi

echo "Script completed successfully!"
