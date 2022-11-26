import { once } from 'node:events';
import fs from 'fs';
import readline from 'readline';

let words = new Set()
const VERSION_FILE = './dataset/out/version.json'
const OUTPUT_FILE = './dataset/out/words.txt'
const DATASET_FILE = './dataset/words.txt'

// For self-hosters, you can use this to customize the words in the dataset.
// After setting your filter, you can do npm run filter to create the output.txt
// then move that output.txt into the static/dataset folder and rename it as words.txt.
function readAndWrite(name: string, filter: (line: string) => boolean): readline.Interface {
    try {fs.mkdirSync('./dataset/out/')} catch(ex) {}
    let output = fs.createWriteStream(OUTPUT_FILE)

    return readline.createInterface({
        input: fs.createReadStream(name),
        crlfDelay: Infinity,
    })
    .on('line', (line) => {
        if (filter(line)) {
            if (words.has(line)) { 
                console.log('A duplicate word has been found: ' + line)
                return; 
            }

            words.add(line)
            if (words.size > 1) {
                output.write("\n")
            }
            output.write(line)
        }
    })
    .on('close', () => output.end())
}

async function createVersion() {
    var version = 1.0
    if (fs.existsSync(VERSION_FILE)) {
        const versionFile = JSON.parse(fs.readFileSync(VERSION_FILE, { encoding: 'utf-8' }))
        if (versionFile.version) { version = versionFile.version + .1;  }
    }
    fs.writeFileSync(VERSION_FILE, JSON.stringify({ version: version }))
}

(async () => await once(readAndWrite(DATASET_FILE, (line) => line.length >= 4),'close').then(() => createVersion()))()