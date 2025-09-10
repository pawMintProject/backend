import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthBoss, checkAuthUser } from "../../utils/authValid.mjs";
import { convertToSheet } from "../../utils/excelConvert.mjs";
const prisma = new PrismaClient();
import crypto from 'crypto'


router.get('/api/admin/log/finance/:time', checkAuthAdmin, async (req, res) => {
    try {
        const { time } = req.params
        let name = new Date()
        name =name.getTime()
        let data = await prisma.orders.findMany({ where: { payed: true }, include: { trasactions: true } })
        console.log(data)
        data = data.filter(el => new Date(el.insertTime) > new Date(time))
        data = data.map(el=>{
            // console.log(el.trasactions)
            el["transActionTime"]= el.trasactions.insertDate
            el["ref_id"]= el.trasactions.ref_id
            el["card_hash"]= el.trasactions.card_hash
            el["card_pan"]= el.trasactions.card_pan
            el["amount"]= el.trasactions.amount
            el["authority"]= el.trasactions.authority
            el["fee"]= el.trasactions.fee
            return el
        })
        let totalCount = 0
        data.forEach(el => totalCount += el.count)
        let totalFinalPrice = 0
        data.map(el => totalFinalPrice += parseInt(el.finalCost))
        let totalFee = 0
        data.map(el => totalFee += parseInt(el.finalCost))
        let totalPrice = 0
        data.map(el => totalPrice += parseInt(el.finalCost))
        let totalSendPrice = 0
        data.map(el => totalSendPrice += parseInt(el.finalCost))
        data.push({ id: "total", count: totalCount, finalCost: totalFinalPrice, fee: totalFee, price: totalPrice, sendPrice: totalSendPrice })

        console.log(data,"--------")
        data = convertToSheet(data, `assets/upload/logs/${name}.xlsx`)
        res.status(200).send(`${req.get('host')}/files/upload/logs/${name}.xlsx`);
        // res.send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get('/api/admin/log/actions', checkAuthAdmin, async (req, res) => {
    try {
        let data = []
        let tickets = await prisma.ticket.findMany({ take: 10 });
        let judgement = await prisma.judgement.findMany({ take: 10 });
        tickets.forEach(el => data.push(el))
        judgement.forEach(el => data.push(el))
        data.sort((a, b) => new Date(a.insertTime) + new Date(b.insertTime))
        res.status(200).send(data);
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


router.get('/api/admin/log/routine', checkAuthAdmin, async (req, res) => {
    try {
        let data = await prisma.routineLog.findMany();
        res.status(200).send(data);
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


export default router