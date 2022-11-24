import { once } from 'node:events';
import fs from 'fs';
import readline from 'readline';

// For self-hosters, you can use this to customize the words in the dataset.
// After setting your filter, you can do npm run filter to create the output.txt
// then move that output.txt into the static/dataset folder and rename it as words.txt.
function readAndWrite(name: string, filter: (line: string) => boolean): readline.Interface {
    let output = fs.createWriteStream('./dataset/output.txt')
    return readline.createInterface({
        input: fs.createReadStream(name),
        crlfDelay: Infinity
    })
    .on('line', (line) => {
        if (filter(line)) {
            output.write(line + "\n")
        }
    })
    .on('close', () => output.end())
}

(async () => await once(readAndWrite('./dataset/words.txt', (line) => line.length > 4),'close'))()