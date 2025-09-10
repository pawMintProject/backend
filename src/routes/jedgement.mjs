import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthUser } from "../utils/authValid.mjs";
import { SendSms } from "../utils/sendSms.mjs";
const prisma = new PrismaClient();


router.post('/api/judgement/create', checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user;
        let { id, message, files, title } = req.body;
        const order = await prisma.orders.findFirst({ where: { id }, include: { product: true } })
        if (order) {
            if (order.userId == phone) {
                console.log("buyer")
                await prisma.judgement.create({ data: { id, sellerId: order.product.userId, buyerId: order.userId, buyerMessage: message, buyerFiles: files, title, reqBuyer: true } })
                await SendSms(order.userId  , "درخواست داوری شما ثبت شد")
                await SendSms(order.product.userId, " درخواست داوری علیه ثبت شد 24 زمان دارید تا پاسخگو باشید ")
            } else if (order.product.userId == phone) {
                console.log("seller")
                await prisma.judgement.create({ data: { id, sellerId: order.product.userId, buyerId: order.userId, sellerMessage: message, sellerFiles: files, title, reqBuyer: false } })
                await SendSms(order.product.userId, "درخواست داوری شما ثبت شد")
                await SendSms(order.userId, " درخواست داوری علیه ثبت شد 24 زمان دارید تا پاسخگو باشید ")
            }

            // body["userId"] = phone
            // await prisma.judgement.create({ data: body })
            res.status(201).send(order)

        }
        else {
            res.status(404).send("سفارش یافت نشد")
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/judgement/all', checkAuthAdmin, async (req, res) => {
    try {
        const querys = await req.query
        console.log(querys)
        let data = await prisma.judgement.findMany({ include: { order: { include: { user: true, product: { include: { user: true } } } } } })
        if (querys.state == "new") {
            data = data.filter(el => !el.answer)
        } else if (querys.state == "finished") {
            data = data.filter(el => el.answer)
        }
        if (querys.start && querys.end) {
            data = data.filter(el => new Date(el.insertTime) > new Date(querys.start) && new Date(el.insertTime) < new Date(querys.end))
        } if (querys.query) {
            data = data.filter(el => el.order.id == querys.query || el.sellerId.includes(querys.query)||el.buyerId.includes(querys.query))
        }
        res.status(201).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/judgement/Allmine', checkAuthUser, async (req, res) => {
    try {
        const user = req.user;
        const data = await prisma.judgement.findMany({ where: { userId: user.phone } })
        res.status(201).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/judgement/Answerdmine', checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user;
        let data = await prisma.judgement.findMany({ where: { NOT: { finalJudge: "waiting" } },include:{order:{include:{product:true}}} })
        data = data.filter(el => el.buyerId == phone || el.sellerId == phone)
        data = data.map(el => {
            if (el.reqBuyer) {
                if (el.buyerId==phone) {
                    el["yours"] = true
                } else {
                    el["yours"] = false
                }
            } else {
                if (el.sellerId==phone) {
                    el["yours"] = true
                } else {
                    el["yours"] = false
                }
            }
            return el
        })
       
        res.status(201).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/judgement/wait', checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user;
        let data = await prisma.judgement.findMany({ where: { finalJudge: "waiting" },include:{order:{include:{product:true}}}}     )
        data = data.filter(el => el.buyerId == phone || el.sellerId == phone)
        res.status(201).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


router.post('/api/judgement/answer', checkAuthAdmin, async (req, res) => {
    try {

        let { answer, id, Adminfile, side } = req.body;
        const judge = await prisma.judgement.findFirst({ where: { id }, include: { order: true } })
        if (judge.buyerMessage) {
            console.log("req from buyer")
            await SendSms(judge.buyerId,  `داوری شما به ایدی ${id} به نفع ${side == "buyer" ? "خریدار" : "فروشنده"} تمام شد`)
            await SendSms(judge.sellerId, `داوری علیه شما به ایدی ${id} به نفع ${side == "buyer" ? "خریدار" : "فروشنده"} تمام شد`)

        } else {
            console.log("req from seller")
            await SendSms(judge.sellerId, `داوری شما به ایدی ${id} به نفع ${side == "buyer" ? "خریدار" : "فروشنده"} تمام شد`)
            await SendSms(judge.buyerId, `داوری علیه شما به ایدی ${id} به نفع ${side == "buyer" ? "خریدار" : "فروشنده"} تمام شد`)
        }
        if (side = "buyer") {
            const user = await prisma.user.findFirst({ where: { phone: judge.buyerId } })
            await prisma.user.update({ where: { phone: judge.buyerId }, data: { money: (parseInt(user.money) + (judge.order.price * judge.order.count) + judge.order.sendPrice).toString() } })

        } else {
            const user = await prisma.user.findFirst({ where: { phone: judge.sellerId } })
            await prisma.user.update({ where: { phone: judge.sellerId }, data: { money: (parseInt(user.money) + (judge.order.price * judge.order.count) + judge.order.sendPrice).toString() } })

        }

        await prisma.judgement.update({ where: { id: id }, data: { adminFiles: Adminfile, adminMessage: answer, finalJudge: side } })
        res.status(201).send("")
    } catch (error) {
        console.log(error)

        res.status(500).send(error);
    }
})
router.get('/api/judgement/answer', checkAuthAdmin, async (req, res) => {
    try {
        const data = await prisma.judgement.findMany({ where: { answer: null } })
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/judgement/Mine/waitAnswer', checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        const data = await prisma.judgement.findMany({ where: { OR: [{ buyerId: phone, buyerMessage: null }, { sellerId: phone, sellerMessage: null }] },include:{order:{include:{product:true}}} })
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.post('/api/judgement/Mine/waitAnswer', checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        let body = req.body;
        
        const data = await prisma.judgement.findFirst({where:{id:body.id}})
        if (data.reqBuyer ==true) {
            await prisma.judgement.update({ where: { id:body.id }, data: { sellerFiles: body.files, sellerMessage: body.message} })
            
        } else {
            await prisma.judgement.update({ where: { id:body.id }, data: { buyerFiles: body.files, buyerMessage: body.message} })
        }

        res.status(201).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})





export default router