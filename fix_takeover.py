import sys

file_path = r"c:\Users\alexf\Documents\Site Dropsiders V2\src\pages\TakeoverPage.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix 1: Structural mess around line 5210-5213 (0-indexed 5209-5212)
# We look for lines that look like those and replace them.
for i in range(len(lines) - 5):
    if "</AnimatePresence>" in lines[i] and "</div>" in lines[i+1] and ")}" in lines[i+2] and "</div>" in lines[i+3]:
        # Identify the block
        # Check if it matches what we saw
        print(f"Found structural issue at line {i+1}")
        # Current:
        # lines[i]   : </AnimatePresence>
        # lines[i+1] : </div>
        # lines[i+2] : )}
        # lines[i+3] : </div>
        
        # We want:
        # lines[i]   : </AnimatePresence>
        # lines[i+1] : </div>
        # lines[i+2] : </div>
        # lines[i+3] : )}
        
        lines[i+1] = lines[i+1].replace("</div>", "") # remove it
        if not lines[i+1].strip(): lines[i+1] = ""
        
        lines[i+2] = lines[i+2].replace(")}", "</div>")
        lines[i+3] = lines[i+3].replace("</div>", ")}  </div>") # Close both
        
        # Actually let's just rewrite the block cleanly
        indent_base = lines[i].split("</AnimatePresence>")[0]
        lines[i]   = f"{indent_base}</AnimatePresence>\n"
        lines[i+1] = f"{indent_base}    </div>\n"
        lines[i+2] = f"{indent_base}</div>\n"
        lines[i+3] = f"{indent_base.replace('    ', '', 1)}}})\n"
        break

# Fix 2: Duplicate downloader buttons
# We have a block that repeats
downloader_btn = "onClick={() => setShowDownloader(true)}"
indices = [i for i, l in enumerate(lines) if downloader_btn in l]
if len(indices) > 1:
    print(f"Found {len(indices)} downloader buttons")
    # Remove duplicates but keep the first one
    # Assuming they are close
    # We'll just remove the second one's block
    # Start looking from the second index
    idx = indices[1]
    # Find start and end of {hasModPowers && (...)}
    start = -1
    for k in range(idx, idx - 10, -1):
        if "hasModPowers &&" in lines[k]:
            start = k
            break
    end = -1
    for k in range(idx, idx + 10):
        if "}" in lines[k]:
            end = k
            break
    if start != -1 and end != -1:
        for k in range(start, end + 1):
            lines[k] = ""

# Fix 3: Missing Downloader Popup at the end
if "showDownloader &&" not in "".join(lines[-100:]):
    print("Adding Downloader popup")
    # Find the end of return (before </body> style tags or just before </>)
    marker = "            </style>"
    for i in range(len(lines)-1, 0, -1):
        if marker in lines[i]:
            insertion_point = i
            popup_code = """
            {/* Downloader Popup */}
            <AnimatePresence>
                {showDownloader && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#111] border border-white/10 rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-2"
                        >
                            <button
                                onClick={() => setShowDownloader(false)}
                                className="absolute top-8 right-8 z-50 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all focus:outline-none"
                            >
                                <X className="w-5 h-5 transition-transform hover:rotate-90 text-gray-500" />
                            </button>
                            <Downloader isPopup={true} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
"""
            lines.insert(insertion_point, popup_code)
            break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done")
