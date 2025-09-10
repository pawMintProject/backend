


import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function convertToSheet(json, route) {
    // Convert JSON to worksheet
    const worksheet =await XLSX.utils.json_to_sheet(json);

    // Create a new workbook and append the worksheet
    const workbook = await XLSX.utils.book_new();
    await XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Write the workbook to a file
    await XLSX.writeFile(workbook, route);
   

}

