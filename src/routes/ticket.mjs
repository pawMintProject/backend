import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthUser } from "../utils/authValid.mjs";
import { SendSms } from "../utils/sendSms.mjs";
const prisma = new PrismaClient();


router.post('/api/ticket/create', checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user;
        let body = req.body;
        const user = prisma.user.findFirst({ where: { phone } })
        user.email && await SendEmail(`تیکت شما  با عنوان ${body.name} ساخته شد`, user.email, user.name || user.phone)
        await SendSms(phone, `تیکت شما  با عنوان ${body.name} ساخته شد`)
        body["userId"] = phone
        const ticket = await prisma.ticket.create({ data: { name: body.name, type: body.type, userId: phone, ordersId: body?.orderId } })
        await prisma.ticket_Message.create({ data: { text: body.message, file: body.file, ticketId: ticket.id, userId: ticket.userId } })
        res.status(201).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})




router.get('/api/ticket/all', checkAuthAdmin, async (req, res) => {
    try {

        let data = await prisma.ticket.findMany({ include: { _count: true } })
        data.sort((a, b) => a.insertTime - b.insertTime)
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/ticket/Answerdmine', checkAuthUser, async (req, res) => {
    try {
        const user = req.user;
        let data = await prisma.ticket.findMany({ where: { userId: user.phone }, include: { ticket_Message: true } })

        data = data.filter(el => el.ticket_Message.length > 1)

        res.status(201).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/ticket/Allmine', checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user;
        let data = await prisma.ticket.findMany({ where: { userId: phone }, include: { ticket_Message: true } })
        data = data.filter(el => el.ticket_Message.length < 2)
        // console.log(data)
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.post('/api/ticket/answer', checkAuthUser, async (req, res) => {
    try {

        let body = req.body;
        let { phone } = req.user
        await prisma.ticket_Message.create({ data: { text: body.text, file: body.file, userId: phone, ticketId: body.ticketId, isSender: body.side } })
        // await prisma.ticket.update({ where: { id: body.id }, data: body })
        // const ticket = await prisma.ticket.findFirst({ where: { id: body.id } })

        // const user = prisma.user.findFirst({ where: { phone: ticket.userId } })
        // user.email && await SendEmail("به تیکت شا پاسخ داده شد", user.email, user.name || user.phone)
        res.status(201).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get('/api/ticket/answer', checkAuthAdmin, async (req, res) => {
    try {

        let data = await prisma.ticket.findMany({ include: { ticket_Message: true } })
        data = data.filter(el => el.ticket_Message.length < 2)
        data.sort((a, b) => a.insertTime - b.insertTime)
        res.status(200).send(data)
    } catch (error) {
        console.log(error)

        res.status(500).send(error);
    }
})

router.get('/api/ticket/byId/:id', checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        const { id } = req.params
        let data = await prisma.ticket.findFirst({ where: { id, userId: phone }, include: { ticket_Message: true } })
        data?.ticket_Message.sort((a, b) => b.insertDate - a.insertDate)
        console.log(data)
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/ticket/admin/byId/:id', checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        let data = await prisma.ticket.findFirst({ where: { id }, include: { ticket_Message: true } })
        data?.ticket_Message.sort((a, b) => b.insertDate - a.insertDate)
        console.log(data)
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get('/api/ticket/admin/userId/:id', checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        let data = await prisma.ticket.findMany({ where: { userId:id }, include: { ticket_Message: true } })
        // data?.ticket_Message.sort((a, b) => b.insertDate - a.insertDate)
        
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})



export default router