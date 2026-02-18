import json
import os
import glob

def check_json_file(filepath):
    print(f"Checking {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        if isinstance(content, list):
            print(f"  OK: Valid JSON list with {len(content)} items.")
            # Basic schema check for id uniqueness
            ids = [item.get('id') for item in content if 'id' in item]
            if len(ids) != len(set(ids)):
                print(f"  WARNING: Duplicate IDs found in {filepath}!")
                # Optional: fix duplicate IDs ?
                return False
            return True
        else:
            print(f"  WARNING: Root element is not a list (got {type(content)}).")
            return False
            
    except json.JSONDecodeError as e:
        print(f"  ERROR: Invalid JSON in {filepath}: {e}")
        return False
    except Exception as e:
        print(f"  ERROR: Could not read {filepath}: {e}")
        return False

def main():
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'src', 'data')
    json_files = glob.glob(os.path.join(data_dir, '*.json'))
    
    if not json_files:
        print(f"No JSON files found in {data_dir}")
        return

    all_ok = True
    for json_file in json_files:
        if not check_json_file(json_file):
            all_ok = False
            
    if all_ok:
        print("\nAll JSON files appear valid.")
    else:
        print("\nSome files have issues. Please fix them manually or ask me to attempt a repair.")

if __name__ == "__main__":
    main()
