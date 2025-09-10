import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthBoss, checkAuthUser } from "../../utils/authValid.mjs";
const prisma = new PrismaClient();

router.post('/api/admin/fee/add', checkAuthBoss, async (req, res) => {
    try {
        let data = await req.body
        data.id = data.id * 1000000
        await prisma.fee.create({ data })
        res.status(201).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/admin/fee/all', checkAuthBoss, async (req, res) => {
    try {
        let data = await prisma.fee.findMany()
        data = data.map(el => {
            let i = el
            i.id = i.id / 1000000
            return i
        })
        res.status(201).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.put('/api/admin/fee/update', checkAuthBoss, async (req, res) => {
    try {
        const data = await req.body
        await prisma.fee.update({ data, where: { id: data.id } })
        res.status(201).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.delete('/api/admin/fee/delete/:id', checkAuthBoss, async (req, res) => {
    try {
        const { id } = req.params
        
        await prisma.fee.delete({ where: { id: parseFloat(id)*1000000 } })
        res.status(200).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

// router.get('/api/admin/fee/add', checkAuthBoss, async (req, res) => {
//     try {
//         const { time } = req.params
//         const name = crypto.randomInt(1000, 9999).toString();
//         let data = await prisma.orders.findMany({ where: { payed: true }, select: { id: true, count: true, finalCost: true, payTime: true, payCode: true } })
//         data = data.filter(el => new Date(el.payTime) > new Date(time))
//         let totalCount = 0
//         data.forEach(el => totalCount += el.count)
//         let totalPrice = 0
//         data.map(el => totalPrice += parseInt(el.finalCost))
//         data.push({ id: "total", count: totalCount, finalCost: totalPrice })
//         // res.status(200).send(data)
//         data = convertToSheet(data, `assets/upload/logs/${name}.xlsx`)
//         res.status(200).send(`${req.get('host')}/files/upload/logs/${name}.xlsx`);
//     } catch (error) {
//         console.log(error)
//         res.status(500).send(error);
//     }
// })

export default router