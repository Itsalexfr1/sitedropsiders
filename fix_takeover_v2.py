import sys

file_path = r"c:\Users\alexf\Documents\Site Dropsiders V2\src\pages\TakeoverPage.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix 1: Structural mess with line 5213 having }) instead of )}
text = text.replace("                                        })\n", "                                        )}\n")
text = text.replace("                                        })\r\n", "                                        )}\r\n")

# Fix 2: Duplicate downloader buttons
# Look for {hasModPowers && (<button ... Download ... </button>)} block twice
import re
pattern = r'\{hasModPowers && \(\s*<button\s+onClick=\{\(\) => setShowDownloader\(true\)\}[\s\S]+?<Download[\s\S]+?<\/button>\s*)\}'
matches = list(re.finditer(pattern, text))
if len(matches) > 1:
    print(f"Found {len(matches)} matches for downloader button")
    # Remove second match
    second = matches[1]
    text = text[:second.start()] + text[second.end():]

# Fix 3: Add Downloader Popup
if "showDownloader &&" not in text:
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
    # Find the last </style>
    if "`}</style>" in text:
        text = text.replace("`}</style>", "`}</style>" + popup_code)
    else:
        # Fallback before the end of return
        text = text.replace("</>\n            );\n}", popup_code + "</>\n            );\n}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
