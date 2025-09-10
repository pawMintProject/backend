import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export function PageinationCustom(data, rowPer, page) {
    if (page && rowPer) { data = data.slice((page * rowPer) - rowPer, page * rowPer) }
    return data
}
export function FilterCustom(data, priceName, dateName, maxPrice, minPrice, minDate, maxDate) {
    if (minPrice && maxPrice) { data = data.filter(el => el[priceName] > minPrice && el[priceName] < maxPrice) }
    if (minDate && maxDate) { data = data.filter(el => new Date(el[dateName]) > new Date(minDate) && new Date(el[dateName]) < new Date(maxDate)) }
    return data
}
export function SortCustom(data, sort, dateName, priceName) {
    if (sort) {
        if (sort == "dateDown") {
            data.sort((a, b) => new Date(a[dateName]) - new Date(b[dateName]))

        } else if (sort == "dateUp") {
            data.sort((a, b) => new Date(b[dateName]) - new Date(a[dateName]))
        } else if (sort == "priceUp") {
            data.sort((a, b) => b[priceName] - a[priceName])
        } else if (sort == "priceDown") {
            data.sort((a, b) => a[priceName] - b[priceName])
        }

    }
    return data
}