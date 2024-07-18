import os
import glob

def combine_files(root_dir, output_file):
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk(root_dir):
            for file in files:
                if file.endswith(('.md', '.py', '.tf', '.txt')) and file not in ['terraform.tfstate', 'terraform.tfstate.backup']:
                    file_path = os.path.join(root, file)
                    outfile.write(f"\n\n--- {file_path} ---\n\n")
                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                    except UnicodeDecodeError:
                        outfile.write(f"Unable to read {file_path} - it might be a binary file.")

# Specify the root directory of your project
root_directory = '.'  # Current directory, change if needed

# Specify the output file name
output_file = 'combined_project_files.txt'

combine_files(root_directory, output_file)
print(f"All files have been combined into {output_file}")