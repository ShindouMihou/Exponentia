export function hide(word: string): string {
    let result = '';
    for (let i = 0; i < word.length; i++) {
        result += '•';
    }

    return result;
}

export function reduce(content: string): string {
    let newContents = '';
    for (let i = 0; i < content.length; i++) {
        if (i % (Math.floor(Math.random() * 2)) == 0) { newContents += content.charAt(i); } else { newContents += '•'; }
    }

    return newContents
}

export function diff(a: string, b: string): number {
    return a.length > b.length ? a.length - b.length : b.length - a.length;
}