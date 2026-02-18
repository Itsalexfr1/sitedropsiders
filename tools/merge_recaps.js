import fs from 'fs';
import path from 'path';

const baseDir = 'c:/Users/alexf/Documents/Site Dropsiders V2';
const recapsPath = path.join(baseDir, 'src/data/recaps.json');
const content1Path = path.join(baseDir, 'src/data/recaps_content_1.json');
const content2Path = path.join(baseDir, 'src/data/recaps_content_2.json');

const recaps = JSON.parse(fs.readFileSync(recapsPath, 'utf8'));
const content1 = JSON.parse(fs.readFileSync(content1Path, 'utf8'));
const content2 = JSON.parse(fs.readFileSync(content2Path, 'utf8'));

const allContent = [...content1, ...content2];
const contentMap = new Map(allContent.map(item => [item.id, item.content]));

const updatedRecaps = recaps.map(recap => ({
    ...recap,
    content: contentMap.get(recap.id) || ""
}));

fs.writeFileSync(recapsPath, JSON.stringify(updatedRecaps, null, 2), 'utf8');
console.log('Merged content into recaps.json');
