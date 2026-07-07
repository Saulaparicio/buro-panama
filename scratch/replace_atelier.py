import os

exclude_dirs = {'.git', 'node_modules', 'dist', '.agent', 'scratch'}
file_extensions = {'.ts', '.tsx', '.html', '.css', '.js', '.mjs', '.json', '.md'}

def replace_in_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        # Try fallback encoding
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                content = f.read()
        except Exception as e:
            print(f"Skipping {file_path} due to read error: {e}")
            return

    original = content
    # Perform case-sensitive replacements
    content = content.replace("Atelier", "Workspace")
    content = content.replace("atelier", "workspace")
    content = content.replace("ATELIER", "WORKSPACE")

    if content != original:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {file_path}")
        except Exception as e:
            print(f"Error writing to {file_path}: {e}")

def main():
    workspace_path = r"c:\Antigravity\buró-panamá-workspace"
    for root, dirs, files in os.walk(workspace_path):
        # Modify dirs in-place to skip excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in file_extensions:
                file_path = os.path.join(root, file)
                replace_in_file(file_path)

if __name__ == '__main__':
    main()
