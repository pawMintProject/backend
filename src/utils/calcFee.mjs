
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient();


const CalcFee = async (price) => {

    let fee = await prisma.fee.findMany()
    fee.sort((a, b) => b.id - a.id)
    fee = fee.filter(el => price >= el.id)
    return price*(fee[0].fee/100)

}
export { CalcFee }