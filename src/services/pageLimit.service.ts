export function check(page: string | undefined, limit: string | undefined): boolean {
    if (page === undefined || limit === undefined) {
        if(page == undefined && limit == undefined)
            return true;
        if((page == undefined && isNaN(Number(limit))) || (limit == undefined && isNaN(Number(page))))
            return false;
        return true;
    }
    if (isNaN(Number(page)) || isNaN(Number(limit))) {
        return false;
    }
    return true;
}