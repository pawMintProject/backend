import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthUser } from "../utils/authValid.mjs";
import { CollectOrderProduct } from "../utils/orderProduct.mjs";
const prisma = new PrismaClient();

router.get("/api/money/order/current/", checkAuthUser, async (req, res) => {
    try {
        const user = req.user
        const create = await prisma.orders.findMany({ where: { user: { phone: user.phone }, finish: "waiting", payed: true } })
        res.status(200).send(create)

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/money/paid", checkAuthUser, async (req, res) => {
    try {
        const user = req.user

        const userData = await prisma.user.findFirst({ where: { phone: user.phone } })
        
        let order = []
        if (userData.isSeller == true) {
            
            order = await prisma.orders.findMany({ where: { orderProduct: { some: { products: { userId: user.phone } } }, payed: true }, select: { trasactions: { select: { card_pan: true } }, id: true, insertTime: true, payStatus: true,orderProduct:true } })
        } else {
            
            order = await prisma.orders.findMany({ where: { userId: user.phone, payed: true }, select: { trasactions: { select: { card_pan: true } }, id: true, insertTime: true, payStatus: true,orderProduct:true } })
        }
        order = await CollectOrderProduct(order)

        order.sort((a, b) => b.insertTime - a.insertTime)
        res.status(200).send(order)


    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/money/earn", checkAuthUser, async (req, res) => {
    try {
        const user = req.user
        const data = await prisma.sellerIncome.findMany({ where: { userId: user.phone, status: "success" } })


        data.sort((a, b) => b.insertDate - a.insertDate)
        res.status(200).send(data)


    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/money/order/cancel", checkAuthUser, async (req, res) => {// درست شود
    try {
        const user = req.user
        const create = await prisma.orders.findMany({ where: { user: { phone: user.phone }, NOT: { payStatus: "success" } } })
        res.status(200).send(create)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get("/api/money/income", checkAuthUser, async (req, res) => {
    try {
        const user = req.user
        const create = await prisma.user.findFirst({ where: { phone: user.phone } });

        res.status(200).send(create?.money || "0")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/money/allIncome", checkAuthAdmin, async (req, res) => {
    try {

        const data = await prisma.sellerIncome.findMany()

        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.patch("/api/money/income", checkAuthUser, async (req, res) => {
    try {
        const user = req.user

        const userData = await prisma.user.findFirst({ where: { phone: user.phone } });
        if (userData?.walletNumber) {
            const income = await prisma.sellerIncome.create({ data: { amount: userData.money, name: userData.walletHolder, wallet: userData.walletNumber, userId: userData.phone } })
            const update = await prisma.user.update({ where: { phone: user.phone }, data: { money: "0" } })
            await SendEmail(`یک درخواست پرداخت ثبت شده است به شماره ${user.phone} و مبلغ ${userData.money} ثبت شده است ایدی این درخواست ${income.id} است`, "sootpay@gmail.com", "admin")

            res.status(200).send("")
        }
        else {
            res.status(400).send("")
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.patch("/api/money/Acceptincome/:id", checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        await prisma.sellerIncome.update({ where: { id }, data: { success: true } });
        res.status(200).send("")

    } catch (error) {

        res.status(500).send(error);
    }
})
export default router