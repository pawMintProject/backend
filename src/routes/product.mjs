import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthUser } from "../utils/authValid.mjs";
import { CalcFee } from "../utils/calcFee.mjs";
import { SendSms } from "../utils/sendSms.mjs";
const prisma = new PrismaClient();

// add product (add product page)
router.post("/api/product/add", checkAuthUser, async (req, res) => {
    try {
        const user = req.user
        let body = req.body
        body["userId"] = await user.phone
        const create = await prisma.products.create({ data: body })
        const check = prisma.user.findFirst({ where: { phone: user.phone } })
        check.email && await SendEmail("کالای شما با موفقیت افزوده شد", check.email, check.name || check.phone)
        res.status(201).send(create)

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.put("/api/product/add", checkAuthUser, async (req, res) => {
    try {
        const user = req.user
        let body = req.body
        await prisma.products.update({ data: body, where: { id: body.id } })
        const check = prisma.user.findFirst({ where: { phone: user.phone } })
        check.email && await SendEmail("کالای شما با موفقیت بروزرسانی شد", check.email, check.name || check.phone)
        await SendSms(user.phone, "کالای شما با موفقیت بروزرسانی شد")
        res.status(201).send()

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
// all product as seller (reserve)
router.get("/api/product/all", checkAuthAdmin, async (req, res) => {
    try {
        const data = await prisma.products.findMany()
        res.status(200).send(data)

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

// my product as seller (add product page)

router.get("/api/product/mine", checkAuthUser, async (req, res) => {
    try {
        const user = req.user
        let data = await prisma.products.findMany({ where: { userId: user.phone } })
        data.sort((a, b) => b.insertDate - a.insertDate)
        res.status(200).send(data)

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

// get product by id (main page)
router.get("/api/product/byId/:id/:count", async (req, res) => {
    try {
        const { id, count } = req.params
        const { orderIdForAddPr = undefined } = req.query

        const data = await prisma.products.findFirst({ where: { id: parseInt(id), canSell: true }, include: { user: true } })
        if (data?.id) {
            if (orderIdForAddPr) {
                const orderData = await prisma.orders.findFirst({ where: { id: orderIdForAddPr }, include: { orderProduct: { include: { products: true } } } })
                if (orderData?.orderProduct[0]?.products?.userId == data.userId) {

                    if (orderData.orderProduct.find(el => el.productId == id)) {
                        res.status(404).send("این کالا در سبد خرید موجود است برای خرید بیشتر تعداد آن را افزایش دهید")
                    } else {

                        let tariff = await CalcFee(data.price * count)
                        data["tariff"] = { fee: tariff }
                        // data["sendPrice"] = data.SendPrice
                        data["total"] = tariff + data.SendPrice + (data.price * count)
                        res.status(200).send(data)
                    }


                } else {
                    res.status(404).send("کد محصول انتخاب شده مربوط به این فروشنده نمی باشد")
                }
            } else {
                let tariff = await CalcFee(data.price * count)
                data["tariff"] = { fee: tariff }
                
                // data["sendPrice"] = data.SendPrice
                data["total"] = tariff + data.SendPrice + (data.price * count)
                res.status(200).send(data)
            }

        } else {
            res.status(404).send("کالایی با این کد وجود ندارد")
        }



    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

// get product for update products by id 
router.get("/api/product/byIdForCheck/:id/:count", async (req, res) => {
    try {
        const { id, count } = req.params
        const data = await prisma.products.findFirst({ where: { id: parseInt(id) }, include: { user: true } })
        if (data?.id) {
            let tariff = await CalcFee(data.price * count)
            data["tariff"] = { fee: tariff }
            data["total"] = tariff + data.SendPrice + (data.price * count)
            res.status(200).send(data)
        } else {
            res.status(404).send("کالا وجود ندارد")
        }



    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


router.delete("/api/product/byId/:id", async (req, res) => {
    try {
        const { id } = req.params

        await prisma.products.delete({ where: { id: parseInt(id) } })

        res.status(200).send(data)




    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})



export default router