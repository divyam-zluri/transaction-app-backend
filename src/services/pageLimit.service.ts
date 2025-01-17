export function check(page: string | undefined, limit: string | undefined): boolean {
    if (page === undefined || limit === undefined) {
        return true;
    }
    if (isNaN(Number(page)) || isNaN(Number(limit))) {
        return false;
    }
    return true;
}