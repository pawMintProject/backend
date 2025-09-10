import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthBoss, checkAuthUser } from "../../utils/authValid.mjs";
const prisma = new PrismaClient();


router.get('/api/admin/dashboard/data', checkAuthAdmin, async (req, res) => {
    try {
        let user = await prisma.user.findMany({ include: { products: { include: { orders: true } } } })
        let userCount = user.length.toString()
        let list = []
        for (let index = 0; index < user.length; index++) {
            const element = user[index];
            let len = 0
            let price = 0

            element.products.forEach((el) => {
                console.log(element.phone, element.products.length, el.orders.length)
                el.orders.forEach(e => {
                    if (e.finish == "success") {
                        len += 1
                        price += e.price

                    }
                })

            })
            if (len > 0) {
                list.push({ id: element.phone, email: element.email, count: len, price })
            }

        }
        list = list.sort((a, b) => b.price - a.price)
        list = list.map((el, index) => index < 5 && el)
        res.status(200).send({ userCount, topSeller: list })
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})



router.get('/api/admin/dashboard/actions', checkAuthAdmin, async (req, res) => {
    try {
        const { query, Minprice, MaxPrice, MinDate, MaxDate } = req.query
        let data = await prisma.trasactions.findMany()
        if (Minprice && MaxPrice) {
            data = data.filter(el => el.price > Minprice && el.price < MaxPrice)
        }
        if (MaxDate && MinDate) {
            data = data.filter(el => new Date(el.insertDate) > new Date(MinDate) && new Date(el.insertDate) < new Date(MaxDate))
        }
        if (query) {
            data = data.filter(el => el.userId.indexOf(query) > -1)
        }
        
        res.status(200).send(data)
    }
    catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

export default router