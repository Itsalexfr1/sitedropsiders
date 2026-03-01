import sys

file_path = r"c:\Users\alexf\Documents\Site Dropsiders V2\src\pages\TakeoverPage.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Fix the structural mess
    if "</AnimatePresence>" in line and i > 5200 and i < 5220:
        new_lines.append(line)
        new_lines.append("                                        </div>\n")
        new_lines.append("                                    </div>\n")
        new_lines.append("                                )}\n")
        new_lines.append("                            </div>\n")
        # Skip the next few lines that were mess
        # Specifically the ones that said </div>, )}, </div>, }) etc.
        continue # skip the rest of the logic for this loop, wait, I need to skip subsequent lines too
    
    # We'll just do a more targeted search
    new_lines.append(line)

# Let's try again with a simpler approach
text = "".join(lines)
text = text.replace('</AnimatePresence>\n                                                </div>\n                                            </div>\n                                         })', 
                    '</AnimatePresence>\n                                                </div>\n                                            </div>\n                                        )}\n                                    </div>')

# Fix duplicate button by simple string replacement if unique enough
btn_to_remove = """                                {hasModPowers && (
                                    <button
                                        onClick={() => setShowDownloader(true)}
                                        className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${showDownloader ? 'bg-neon-cyan text-black border-neon-cyan' : 'bg-white/5 border-white/10 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/30'}`}
                                        title="Social Downloader"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Downloader</span>
                                    </button>
                                )}"""
# Check if it appears twice
if text.count(btn_to_remove) > 1:
    text = text.replace(btn_to_remove, "", 1) # remove first occurrence

# Add popup for downloader
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
                                <XIcon className="w-5 h-5 transition-transform hover:rotate-90 text-gray-500" />
                            </button>
                            <Downloader isPopup={true} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
    """
    if "`}</style>" in text:
        text = text.replace("`}</style>", "`}</style>" + popup_code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
