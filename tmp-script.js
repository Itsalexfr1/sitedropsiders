const fs = require('fs');
const file = 'c:/Users/alexf/Documents/Site Dropsiders V2/src/pages/TakeoverPage.tsx';

try {
    let content = fs.readFileSync(file, 'utf8');

    const botTabStartStr = "{activeSettingsTab === 'bot' && (\\r\\n                                                <div className=\"space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300\">";
    const shopTabStartStr = "{activeSettingsTab === 'shop' && (";
    const shopTabStartStr2 = "{activeSettingsTab === 'shop' && (\\n";

    let botTabStartIndex = content.indexOf("{activeSettingsTab === 'bot' && (");
    let shopTabStartIndex = content.indexOf("{activeSettingsTab === 'shop' && (");

    if (botTabStartIndex === -1 || shopTabStartIndex === -1) {
        console.log('Could not find exact bot tab start index or shop tab start index.');
        process.exit(1);
    }

    // Extract the raw bot section
    const rawBotTabFull = content.substring(botTabStartIndex, shopTabStartIndex);

    // Extract the actual inner bot HTML (excluding the wrapper)
    const botContentStartStr = '<div className=\"bg-white/5 border border-white/5 p-5 rounded-3xl space-y-4\">';
    let botContentStart = rawBotTabFull.indexOf(botContentStartStr);

    if (botContentStart === -1) {
        console.log('Bot content start not found.');
        process.exit(1);
    }

    const botContentEndStr = "                                            )}";
    let botContentEnd = rawBotTabFull.lastIndexOf(botContentEndStr);

    let extractedBotHtml = rawBotTabFull.substring(botContentStart, botContentEnd).trimEnd();

    // 1. Remove the entire BOT tab block from its initial position
    // Take from start of content up to bot start, and from shop start to the end
    content = content.substring(0, botTabStartIndex) + content.substring(shopTabStartIndex);

    // 2. Find the end of the Moderation tab to insert the bot specific content
    // Moderation tab ends just before Planning tab
    const planningTabStartStr = "{activeSettingsTab === 'planning' && (";
    let planningIndex = content.indexOf(planningTabStartStr);

    // We want to insert it right before the closure of moderation tab
    const targetInsertionStr1 = "                                                        </div>\\r\\n                                                    </div>\\r\\n                                                </div>\\r\\n                                            )}\\r\\n                                            {activeSettingsTab === 'planning' && (";
    const targetInsertionStr2Unix = "                                                        </div>\\n                                                    </div>\\n                                                </div>\\n                                            )}\\n                                            {activeSettingsTab === 'planning' && (";

    let existingTarget = "";
    if (content.indexOf(targetInsertionStr1) > -1) existingTarget = targetInsertionStr1;
    else if (content.indexOf(targetInsertionStr2Unix) > -1) existingTarget = targetInsertionStr2Unix;

    if (existingTarget) {
        const replacementStr = existingTarget.replace(
            "                                                </div>\\n                                            )}\\n" + (existingTarget.includes('\\r') ? "" : ""),
            ""
        );

        let mergedStr = "";
        if (existingTarget.includes("\\r\\n")) {
            mergedStr = "                                                        </div>\\r\\n                                                    </div>\\r\\n\\r\\n" + extractedBotHtml + "\\r\\n                                                </div>\\r\\n                                            )}\\r\\n                                            {activeSettingsTab === 'planning' && (";
        } else {
            mergedStr = "                                                        </div>\\n                                                    </div>\\n\\n" + extractedBotHtml + "\\n                                                </div>\\n                                            )}\\n                                            {activeSettingsTab === 'planning' && (";
        }

        content = content.replace(existingTarget, mergedStr);
        fs.writeFileSync(file, content, 'utf8');
        console.log('SUCCESS_MERGE');
    } else {
        console.log('Could not find existing target for insertion.', content.substring(planningIndex - 300, planningIndex + 50));
    }
} catch (error) {
    console.error(error);
}
