function network(item: string) {
    info({ type: 'r', item: item })
}

function event(item: any) {
    info({ type: 'e', item: item })
}

function info(item: any) {
    console.info(JSON.stringify(item))
}

export default { network, info, event }