import json
import os

worker_path = r'c:\Users\alexf\Documents\Site Dropsiders V2\worker.ts'
output_path = r'c:\Users\alexf\Documents\Site Dropsiders V2\src\data\quizzes_default.json'

with open(worker_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Quizzes are between 4662 (0-indexed 4661) and 7665 (0-indexed 7664)
# musicTitlesPool is between 7667 and 7683

# Lines are 1-indexed in the view_file tool
# Line 4662: "const defaultQuizzes = ["
# Line 7665: "];"

# content lines: 4663 to 7664
quiz_lines = lines[4662:7664] 
# musicTitlesPool lines: 7668 to 7682
pool_lines = lines[7667:7682]

quiz_str = "[" + "".join(quiz_lines) + "]"
pool_str = "[" + "".join(pool_lines) + "]"

# Let's try to parse them to be sure
try:
    quizzes = json.loads(quiz_str)
    pool = json.loads(pool_str)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({"quizzes": quizzes, "musicTitlesPool": pool}, f, indent=2, ensure_ascii=False)
    print("Successfully extracted quiz data to JSON")
except Exception as e:
    print(f"Error parsing quiz data: {e}")
    # If it fails, maybe there are trailing commas or JS syntax?
    # I'll just save the raw strings for now to see what's wrong if it fails.
    print("Quiz String first 100 chars:", quiz_str[:100])
    print("Quiz String last 100 chars:", quiz_str[-100:])
