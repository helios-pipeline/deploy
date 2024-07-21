#!/bin/bash

# Set the output file
output_file="cdk.txt"

# Clear the output file if it already exists
> "$output_file"

# Function to process each file
process_file() {
    local file="$1"
    
    # Skip if it's a directory
    if [ -d "$file" ]; then
        return
    fi

    # Skip if it's the output file itself
    if [ "$file" = "$output_file" ]; then
        return

    # Skip binary files
    if file "$file" | grep -q "binary"; then
        echo "Skipping binary file: $file" >&2
        return
    fi

    # Add file name as a header
    echo "File: $file" >> "$output_file"
    echo "----------------------------------------" >> "$output_file"

    # Copy contents
    cat "$file" >> "$output_file"

    # Add a newline after each file
    echo -e "\n\n" >> "$output_file"
}

# Export the function so it's available to find
export -f process_file

# Use find to process all files, excluding the node_modules directory
find . -type f -not -path "./node_modules/*" -exec bash -c 'process_file "$0"' {} \;

echo "All file contents (except those in node_modules) have been copied to $output_file"