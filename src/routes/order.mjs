import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthBoss, checkAuthUser, checkAuthUserBuy, checkAuthUserSell } from "../utils/authValid.mjs";
import { SendEmail } from '../utils/email.mjs'
const prisma = new PrismaClient();

let codes = [];
// product info 2/4
router.post("/api/order/base", checkAuthUserBuy, async (req, res) => {
    try {
        const user = req.user
        let body = req.body
        const product = await prisma.products.findFirst({ where: { id: parseInt(body.productId) } })

        if (body.count > product?.Count) {
            // if it hasn't enough count
            res.status(400).send("تعداد کافی در انبار موجود نمی باشد")
        }
        else {
            let finalFee = (await CalcFee(product.price * body.count))
            body["userId"] = await user.phone
            // body["price"] = product.price * body.count
            // body["sendPrice"] = product.SendPrice
            // body["fee"] = finalFee
            const prId = parseInt(body.productId)
            const prCount = parseInt(body.count)
            body["productId"] = undefined
            body["count"] = undefined
            // body["finalCost"] = ((product.price * body.count) + finalFee + product.SendPrice).toString()
            // development

            const create = await prisma.orders.create({ data: body })
            await prisma.orderProduct.create({ data: { productId: prId, orderId: create.id, count: prCount, price: product.price * prCount, sendPrice: product.SendPrice, userId: user.phone, fee: finalFee } })
            await prisma.orderTiming.create({ data: { id: create.id, create: new Date() } })
            const check = await prisma.user.findFirst({ where: { phone: user.phone } })
            check.email && await SendEmail("مرحله اول سفارش شما انجام شد", check.email, check.name || check.phone)
            res.status(201).send(create)
        }


    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
// reserve 
// router.delete("/api/order/deleteAll", checkAuthBoss, async (req, res) => {
//     try {

//         const deleted = await prisma.orders.deleteMany()
//         res.status(200).send(deleted)

//     } catch (error) {
//         console.log(error)
//         res.status(500).send(error);
//     }
// })


import crypto from "crypto"
import { KavenegarApi } from "kavenegar";
import { CalcFee } from "../utils/calcFee.mjs";
import axios from "axios";
import { SendSms } from "../utils/sendSms.mjs";
import { ExpireOtp } from "../../app.mjs";
import { subDays } from "date-fns";
import { CollectOrderProduct } from "../utils/orderProduct.mjs";
const otpApi = KavenegarApi({
    apikey: '6B74316637314452556473706349706E3632445A6D30754D796C6846796E6A6172715379326552333575303D',
});
const generateOtp = () => {
    return crypto.randomInt(1000, 9999).toString();
}
let otpStore = {}
router.get('/api/order/getCode/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).send({ success: false, msg: 'شماره تلفن وارد نشده است' });
        const order = await prisma.orders.findFirst({ where: { id } })


        const otp = generateOtp();
        otpStore[order?.phone] = { otp, expires: Date.now() + 2 * 60 * 1000 };
        order.phone && await SendSms(order.phone, `مشترک گرامی /n کد شما :${otp}`)
        order.phone && await SendSms(order.phone, `مشترک گرامی /n کد شما :${otp}`)
        res.status(200).send(order.phone)
    } catch (error) {
        res.status(500).send(error)
        console.log(error)


    }

})


// product info 3/4 (back from payment)
router.patch("/api/order/accept/:orderId/:code/:phone", checkAuthUser, async (req, res) => {
    try {
        const user = req.user
        let { orderId, code, phone } = req.params
        console.log(code, phone)
        const Rcode = otpStore[phone]?.otp
        if (code == Rcode) {
            ExpireOtp(phone)
            const order = await prisma.orders.findFirst({ where: { id: orderId } })
            const product = await prisma.products.findFirst({ where: { id: order.productId } })
            await prisma.products.update({ where: { id: order.productId }, data: { Count: product.Count - order.count } })
            const update = await prisma.orders.update({ where: { id: orderId }, data: { accepted: true } })
            const check = prisma.user.findFirst({ where: { phone: user.phone } })
            check.email && await SendEmail("مرحله دوم سفارش شما انجام شد", check.email, check.name || check.phone)
            res.status(201).send(update)
        } else {
            res.status(400).send("کد اشتباه است");

        }



    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

const generateRandomStr = () => {
    return crypto.randomUUID()
}
// product info 4/4 (start to payment)
router.post("/api/order/startPayment", checkAuthUser, async (req, res) => {
    try {
        let { orderId } = req.body
        let { phone } = req.user
        const order = await prisma.orders.findFirst({ where: { id: orderId }, include: { orderProduct: true } })

        let productsPrice = 0
        let sendPrices = 0
        let totalFee = 0
        order.orderProduct.forEach(el => {
            productsPrice += el.price
            sendPrices += el.sendPrice
            sendPrices += el.sendPrice
            totalFee += el.fee
        })


        if (order.payStatus == "waiting") {
            let api = await axios.post("https://sep.shaparak.ir/onlinepg/onlinepg", {
                "action": "token",
                "TerminalId": " 14849769",
                "Amount": parseInt(productsPrice + sendPrices + totalFee) * 10,
                "ResNum": orderId,
                "RedirectUrl": "https://sootpay.com/finalOrder/" + orderId,
                "CellNumber": order.userId
            })
            let link = await api.data



            if (link?.status == 1) {

                link = link.token
                res.status(200).send(link)
            } else {
                console.log(link)
                res.status(400).send("مشکل پیش آمده است");
            }
        }
        else {
            res.status(400).send("قبلا پرداخت شده");
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
// dev
// product info 4/4 (back from payment)
router.post("/api/order/payment/:id", checkAuthUser, async (req, res) => {
    try {
        const user = req.user
        let body = req.body
        let { id } = req.params
        const order = await prisma.orders.findFirst({ where: { id, userId: user.phone }, include: { user: true, orderProduct: { include: { products: { include: { user: true } } } } } })
        order["product"] = order.orderProduct[0].products
        let productsPrice = 0
        let sendPrices = 0
        let totalFee = 0
        order.orderProduct.forEach(el => {
            productsPrice += el.price
            sendPrices += el.sendPrice
            sendPrices += el.sendPrice
            totalFee += el.fee
        })


        const api = await axios.post("https://sep.shaparak.ir/verifyTxnRandomSessionkey/ipg/VerifyTransaction",
            {
                "RefNum": body.Authority,
                "TerminalNumber": 14849769
            }
        )

        if (api.data.Success == true) {
            let res = await api.data
            await SendEmail(`یک سفارش از شماره ${user.id} و فروشنده ${order.userId} ثبت شده است نام این محصول ${order.product.name} و ایدی برای پیگیری ${order.product.id} است`, "sootpay@gmail.com", "admin")
            await prisma.orders.update({ where: { id: id }, data: { payed: true, payStatus: "success" } })



            await prisma.trasactions.create({ data: { amount: parseInt(productsPrice + sendPrices + totalFee) * 10, authority: body.Authority, card_hash: res.TransactionDetail.HashedPan, card_pan: res.TransactionDetail.MaskedPan, fee: 0, RRN: res.StraceNo, orderId: order.id, userId: user.phone, ref_id: res.TransactionDetail.RefNum } })





            order.user.email && await SendEmail(`سفارش شما به شماره ${id} با مبلغ ${productsPrice + sendPrices + totalFee} تومان پرداخت شد؛ 
وضعیت سفارش: در انتظار تایید فروشنده
`, order.user.email, order.userId)

            order.product.user.email && await SendEmail(`سفارش شما با کد ${order.id} و به قیمت ${productsPrice + sendPrices + totalFee} ثبت شده است. 
در صورت عدم تایید سفارش ظرف ۴۸ ساعت،سفارش شما به صورت خودکار لغو خواهد شد. 
ضمناً خریدار می‌تواند مادامی که سفارش را تایید نکرده‌اید، آن را لغو کند.`, order.product.user.email, order.product.userId)
            order.product.user.phone && await SendSms(order.product.userId, `سفارش شما با کد ${order.id} و به قیمت ${productsPrice + sendPrices + totalFee} ثبت شده است. 
در صورت عدم تایید سفارش ظرف ۴۸ ساعت،سفارش شما به صورت خودکار لغو خواهد شد. 
ضمناً خریدار می‌تواند مادامی که سفارش را تایید نکرده‌اید، آن را لغو کند.`)

            await SendSms(order.userId, `سفارش شما به شماره ${id} با مبلغ ${productsPrice + sendPrices + totalFee} تومان پرداخت شد؛ 
وضعیت سفارش: در انتظار تایید فروشنده
`)
            // const product = await prisma.products.findFirst({ where: { id: order.productId } })
            // await prisma.products.update({ where: { id: order.productId }, data: { Count: product.Count - order.count } })

        } else {
            console.log("first", "fail")

            await prisma.orders.update({ where: { id: id }, data: { payStatus: "fail" } })
        }


        // const check = prisma.user.findFirst({ where: { phone: user.phone } })
        // check.email && await SendEmail(" مرحله پرداخت سفارش شما انجام شد", check.email, check.name || check.phone)
        res.status(201).send("")
    } catch (error) {
        console.log(error, "-------------------------------------------------")
        res.status(500).send(error);

    }
})

router.patch("/api/order/finish/:id", checkAuthUser, async (req, res) => {
    try {
        let { id } = req.params
        let { phone } = req.user

        const order = await prisma.orders.findFirst({ where: { id, payed: true, userId: phone }, include: { product: true } })
        if (order.finish == "waiting" && order.sellAccept == true) {
            const sellerId = order.product.userId
            const update = await prisma.orders.update({ where: { id }, data: { canCancel: false, canFinish: false, canNoReceive: false, finish: "success", orderTiming: { update: { where: { id }, data: { finish: new Date() } } } } })
            const Puser = await prisma.user.findFirst({ where: { phone: sellerId } })
            const Nuser = await prisma.user.update({ where: { phone: sellerId }, data: { money: (parseInt(Puser.money) + (order.count * order.product.price) + order.sendPrice).toString() } })
            Puser.email && await SendEmail(`سفارش شما با ایدی ${order.id} با موفقیت به اتمام رسید`, Puser.email, Puser.phone)
            await SendSms(Puser.phone, `سفارش شما با ایدی ${order.id} با موفقیت به اتمام رسید`)
            res.status(201).send({ order, id, sellerId, update, Nuser })
        } else {
            res.status(400).send("قبلا تایید شده است")
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.patch("/api/order/cancel/:id", checkAuthUser, async (req, res) => {
    try {
        let { id } = req.params
        let { phone } = req.user

        const order = await prisma.orders.findFirst({ where: { id, payed: true, sellAccept: false, userId: phone }, include: { product: true } })
        if (order?.finish == "waiting") {
            const userId = order.userId
            await prisma.orders.update({ where: { id }, data: { canCancel: false, canFinish: false, canNoReceive: false, finish: "fail", orderTiming: { update: { where: { id }, data: { cancel: new Date() } } } } })
            const Puser = await prisma.user.findFirst({ where: { phone: userId } })
            await prisma.user.update({ where: { phone: userId }, data: { money: (parseInt(Puser.money) + (order.count * order.product.price) + order.sendPrice).toString() } })
            Puser.email && await SendEmail(`سفارش شما با ایدی ${order.id} کنسل شد`, Puser.email, Puser.phone)
            await SendSms(Puser.phone, `سفارش شما با ایدی ${order.id} کنسل شد`)
            res.status(201).send()
        } else {
            res.status(400).send("قبلا کنسل شده است")

        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/order/cancelsMine", checkAuthUser, async (req, res) => {
    try {
        let { phone } = req.user
        let order = await prisma.orders.findMany({ where: { userId: phone, finish: "fail" }, include: { orderProduct: true } })
        order = await CollectOrderProduct(order)
        order.sort((a, b) => b.insertTime - a.insertTime)
        res.status(200).send(order)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/order/finishedMine", checkAuthUser, async (req, res) => {
    try {
        let { phone } = req.user
        let order = await prisma.orders.findMany({ where: { userId: phone, finish: "success" }, include: { orderProduct: true } })
        order = await CollectOrderProduct(order)
        order.sort((a, b) => b.insertTime - a.insertTime)
        res.status(200).send(order)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/order/waitingMine", checkAuthUser, async (req, res) => {
    try {
        let { phone } = req.user
        let order = await prisma.orders.findMany({ where: { userId: phone, finish: "waiting", payStatus: "success", sellAccept: false }, include: { orderProduct: true } })
        order = await CollectOrderProduct(order)
        order.sort((a, b) => b.insertTime - a.insertTime)

        res.status(200).send(order)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }

})
router.get("/api/order/Trend/:id", checkAuthUser, async (req, res) => {
    try {
        let { phone } = req.user
        let { id } = req.params
        let order = await prisma.orderTiming.findFirst({ where: { id }, include: { orders: true } })
        if (order) {
            order["order"] = order.orders
            order["orders"] = undefined
            let messages = []
            if (order.create) {
                messages.push({ date: order.create, step: 0, message: `سفارشتان در تاریخ ${order.create.toLocaleDateString("fa-IR")} ساخته شد` })
            } if (order.noRecieve) {
                messages.push({ date: order.noRecieve, message: `سفارشتان در تاریخ ${order.noRecieve.toLocaleDateString("fa-IR")} بدون دریافت ثبت شد` })
            } if (order.cancel) {
                messages.push({ date: order.cancel, step: 4, message: `سفارشتان در تاریخ ${order.cancel.toLocaleDateString("fa-IR")} لغو شد` })
            } if (order.autoCancel) {
                messages.push({ date: order.autoCancel, step: 4, message: `سفارشتان در تاریخ ${order.autoCancel.toLocaleDateString("fa-IR")} خودکار لغو شد` })
            } if (order.finish) {
                messages.push({ date: order.finish, step: 3, message: `سفارشتان در تاریخ ${order.finish.toLocaleDateString("fa-IR")} تمام شد` })
            } if (order.accept) {
                messages.push({ date: order.accept, step: 1, message: `سفارشتان در تاریخ ${order.accept.toLocaleDateString("fa-IR")} قبول شد` })
            } if (order.send) {
                messages.push({ date: order.send, step: 2, message: `سفارشتان در تاریخ ${order.send.toLocaleDateString("fa-IR")} ارسال شد` })
            }
            // if()
            messages.sort((a, b) => a.date - b.data)
            let custom = [...messages]
            const now = new Date()
            custom.sort((a, b) => b.step - a.step)
            // console.log(custom)
            if (custom[0].step == 0) {
                messages.push({ date: subDays(now, -1), message: 'قبول کردن شدن توسط فروشنده', isNext: true })
                messages.push({ date: subDays(now, -2), message: 'ارسال توسط فروشنده', isNext: true })
                messages.push({ date: subDays(now, -1), message: 'دریافت توسط خریدار', isNext: true })
            } else if (custom[0].step == 1) {
                messages.push({ date: subDays(now, -2), message: 'ارسال توسط فروشنده', isNext: true })

                messages.push({ date: subDays(now, -1), message: 'دریافت توسط خریدار', isNext: true })
            } else if (custom[0].step == 2) {
                messages.push({ date: subDays(now, -1), message: 'دریافت توسط خریدار', isNext: true })
            }
            res.status(200).send({
                messages, canCancel: order.order.canCancel, canFnish: order.order.canFinish, canNorecieve: order.order.canNoReceive, time: order.create
                , trackingCode: order.order.trackCode
            })
        } else {

            res.status(404).send({ success: false, message: "سفارش پیدا نشد" });

        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/order/current", checkAuthUser, async (req, res) => {
    try {
        let { phone } = req.user
        let order = await prisma.orders.findMany({ where: { userId: phone, finish: "waiting", sellAccept: true }, include: { orderProduct: { include: { user: true } } } })
        order = order.map(el => {
            el["sellertData"] = el.orderProduct[0]?.user
            return el
        })
        order = await CollectOrderProduct(order)
        order.sort((a, b) => b.insertTime - a.insertTime)
        res.status(200).send(order)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/order/status/:id", checkAuthUser, async (req, res) => {
    try {
        let { id } = req.params
        const order = await prisma.orders.findFirst({ where: { id }, include: { orderProduct: { include: { products: { include: { user: true } } } } } })
        let productsPrice = 0
        let sendPrices = 0
        let totalFee = 0
        order.orderProduct.forEach(el => {
            productsPrice += el.price
            sendPrices += el.sendPrice
            sendPrices += el.sendPrice
            totalFee += el.fee
        })
        const sendData = {
            id: order.id,
            sellerName: order.orderProduct[0]?.products.user.name,
            insertDate: order.insertTime,
            orderDesc: order.Describe,
            orderAddress: order.adress,
            phone: order.phone,
            postalCode: order.postalCode || "بدون کد پستی",
            productsPrice,
            sendPrices,
            totalFee,
            finalCost: productsPrice + sendPrices + totalFee,
            orderPr: order.orderProduct
        }
        res.status(200).send(sendData)


    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/order/id/:id", checkAuthUser, async (req, res) => {
    try {
        let { id } = req.params
        let order = await prisma.orders.findFirst({ where: { id }, include: { orderProduct: { include: { products: { include: { user: true } } } }, orderTiming: true } })
        order["product"] = order?.orderProduct[0]?.products
        order = await CollectOrderProduct(order)

        res.status(200).send(order)


    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/order/seller/waitAccept", checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        let order = await prisma.orders.findMany({ where: { orderProduct: { some: { userId: phone } }, finish: "waiting", payStatus: "success" }, include: { orderProduct: true, orderTiming: true } })
        order = order.filter(el => !el.sellAccept)
        order = await CollectOrderProduct(order)

        order.sort((a, b) => a.insertTime - b.insertTime)
        res.status(200).send(order)


    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.patch("/api/order/seller/waitAccept/:id", checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        const { id } = req.params
        await prisma.orders.update({ where: { id, orderProduct: { every: { userId: phone } } }, data: { sellAccept: true, canCancel: false, orderTiming: { update: { where: { id }, data: { accept: new Date() } } } } })
        const Puser = await prisma.user.findFirst({ where: { phone } })
        const Buser = await prisma.orders.findFirst({ where: { id }, include: { user: true } })
        Puser.email && await SendEmail(`شما یک سفارشی را با ایدی ${id} قبول کردید`, Puser.email, Puser.phone)
        Buser.user.email && await SendEmail(`فروشنده سفارش شما با ایدی ${id} قبول کرد`, Buser.user.email, Buser.userId.phone)
        await SendSms(Buser.userId, `فروشنده سفارش شما با ایدی ${id} قبول کرد`)


        res.status(202).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get("/api/order/seller/waitTrackCode", checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        let order = await prisma.orders.findMany({ where: { orderProduct: { some: { products: { userId: phone } } }, sellAccept: true, finish: "waiting" }, include: {orderProduct:true, orderTiming: true } })
        order = order.filter(el => !el.trackCode)
        order = await CollectOrderProduct(order)
        order.sort((a, b) => a.orderTiming[0]?.accept - b.orderTiming[0]?.accept)
        res.status(200).send(order)


    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.patch("/api/order/seller/waitTrackCode/:id/:code", checkAuthUser, async (req, res) => {
    try {

        const { phone } = req.user
        const { id, code } = req.params

        const i = await prisma.orders.update({ where: { id, orderProduct: { every: { products: { userId: phone } } }, sellAccept: true, trackCode: null }, data: { trackCode: code, canCancel: false, canFinish: true, orderTiming: { update: { where: { id }, data: { send: new Date() } } } } })
        const Buser = await prisma.orders.findFirst({ where: { id }, include: { user: true } })
        const Suser = await prisma.user.findFirst({ where: { phone } })

        Suser.email && await SendEmail(`شما سفارشی را با ایدی ${id} و کد رهگیری ${code} ارسال کردید`, Suser.email, Suser.phone)
        Buser.user.email && await SendEmail(`سفارش شما با ایدی ${id}ارسال شد`, Buser.user.email, Buser.user.phone)
        await SendSms(Buser.user.phone, `سفارش شما با ایدی ${id}ارسال شد`)
        res.status(202).send(i)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})




router.get("/api/order/seller/finished", checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        let order = await prisma.orders.findMany({ where: { orderProduct: { some: { products: { userId: phone } } }, payStatus: "success", finish: "success" }, include: {orderProduct:true, orderTiming: true } })
        order = order.filter(el => el.sellAccept)
        order.sort((a, b) => a.orderTiming[0]?.finish - b.orderTiming[0]?.finish)
        order = await CollectOrderProduct(order)
        res.status(200).send(order)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/order/seller/canceled", checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        let order = await prisma.orders.findMany({ where: { orderProduct: { some: { userId: phone } }, finish: "fail" }, include: { orderProduct:true, orderTiming: true } })
        order.sort((a, b) => a.orderTiming[0]?.cancel - b.orderTiming[0]?.cancel)
        order = await CollectOrderProduct(order)
        res.status(200).send(order)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get("/api/order/seller/current", checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        let order = await prisma.orders.findMany({ where: { orderProduct: { some: { userId: phone } }, payStatus: "success", finish: "waiting" }, include: {orderProduct:true, orderTiming: true } })
        order = order.filter(el => el.sellAccept && el.trackCode)
        order.sort((a, b) => a.orderTiming[0]?.send - b.orderTiming[0]?.send)
        order = await CollectOrderProduct(order)
        res.status(200).send(order)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})




router.patch("/api/order/buyer/noRecive/:id", checkAuthUser, async (req, res) => {
    try {

        const { phone } = req.user
        const { id } = req.params
        await prisma.orders.update({ where: { id, userId: phone, sellAccept: true }, data: { NoReceive: true, orderTiming: { update: { where: { id }, data: { noRecieve: new Date() } } } } })

        res.status(202).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/order/fee/:price", checkAuthUser, async (req, res) => {
    try {
        let { price, id } = req.params

        const data = await CalcFee(price)
        const product = await prisma.products.findFirst({ where: { id } })

        res.status(200).send({ fee: data, sendPrice: sendPrice })
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


router.get("/api/order/lastPrefer", checkAuthUser, async (req, res) => {

    try {
        const { phone } = req.user
        let order = await prisma.orders.findFirst({ where: { userId: phone } })
        if (order) {
            res.status(200).send({ receiverName: order.receiverName, adress: order.adress, postalCode: order.postalCode, email: order.email, Describe: order.Describe, phone: order.userId })

        } else {
            res.status(200).send({ receiverName: "", adress: "", postalCode: "", email: "", Describe: "", phone: "" })

        }


    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


router.post("/api/order/AddProductToOrder", checkAuthUser, async (req, res) => {

    try {
        const { phone } = req.user
        let { orderId, productId, count } = req.body
        count = parseInt(count)
        productId = parseInt(productId)
        let pr = await prisma.products.findFirst({ where: { id: productId } })
        let order = await prisma.orders.findFirst({ where: { userId: phone, id: orderId, payStatus: "waiting", sellAccept: false, finish: "waiting" }, include: { orderProduct: { include: { products: true } } } })
        if (order) {
            if (order?.orderProduct[0]?.products.userId == pr.userId) {
                const product = await prisma.products.findFirst({ where: { id: productId } })

                if (product) {
                    const userData = await prisma.user.findFirst({ where: { phone: phone } })
                    let finalFee = (await CalcFee(product.price * count))
                    if (userData.PercentOfReduceSendPrice != 0) {
                        await prisma.orderProduct.create({ data: { userId: phone, productId: productId, orderId: orderId, count, price: product.price * count, sendPrice: product.SendPrice - ((product.SendPrice * userData.PercentOfReduceSendPrice) / 100), fee: finalFee } })

                    } else {
                        await prisma.orderProduct.create({ data: { userId: phone, productId: productId, orderId: orderId, count, price: product.price * count, sendPrice: product.SendPrice, fee: finalFee } })

                    }
                    res.status(200).send({ success: true, message: "کالا افزوده شد" })

                } else {
                    res.status(404).send({ success: false, message: "کالا پیدا نشد" })

                }

            } else {
                res.status(400).send({ success: false, message: "فروشنده با فروشنده قبلی برابر نیست" })

            }

        } else {
            res.status(404).send({ success: false, message: "اردر پیدا نشد" })

        }


    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.delete("/api/order/DeleteProductToOrder", checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        const { orderProductId } = req.body
        const data = await prisma.orderProduct.findFirst({ where: { id: orderProductId }, include: { products: true } })
        if (data.count == 1) {
            await prisma.orderProduct.delete({ where: { id: orderProductId, userId: phone } })
            res.status(200).send({ success: true, message: "کالا حذف شد" })
        } else {
            const product = data.products

            const userData = await prisma.user.findFirst({ where: { phone: phone } })

            let finalFee = (await CalcFee(data.products.price * (data.count - 1)))
            if (userData.PercentOfReduceSendPrice != 0) {
                await prisma.orderProduct.update({ where: { id: orderProductId }, data: { count: data.count - 1, price: product.price * (data.count - 1), sendPrice: product.SendPrice - ((product.SendPrice * userData.PercentOfReduceSendPrice) / 100), fee: finalFee } })

            } else {
                await prisma.orderProduct.update({ where: { id: orderProductId }, data: { count: data.count - 1, price: product.price * (data.count - 1), sendPrice: product.SendPrice, fee: finalFee } })

            }
            res.status(200).send({ success: true, message: "کالا کم شد" })



        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.delete("/api/order/DeleteAllProductToOrder/:orderId", checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        const { orderId } = req.params
        await prisma.orderProduct.deleteMany({ where: { orderId, userId: phone } })
        res.status(200).send({ success: true, message: "تمام کالا های سفارش حذف شد" })
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


router.patch("/api/order/IncreaseProductToOrder/:orderProductId", checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        const { orderProductId } = req.params
        const data = await prisma.orderProduct.findFirst({ where: { id: orderProductId }, include: { products: true } })

        const product = data.products

        const userData = await prisma.user.findFirst({ where: { phone: phone } })

        let finalFee = (await CalcFee(data.products.price * (data.count + 1)))
        if (userData.PercentOfReduceSendPrice != 0) {
            await prisma.orderProduct.update({ where: { id: orderProductId }, data: { count: data.count + 1, price: product.price * (data.count + 1), sendPrice: product.SendPrice - ((product.SendPrice * userData.PercentOfReduceSendPrice) / 100), fee: finalFee } })

        } else {
            await prisma.orderProduct.update({ where: { id: orderProductId }, data: { count: data.count + 1, price: product.price * (data.count + 1), sendPrice: product.SendPrice, fee: finalFee } })

        }
        res.status(200).send({ success: true, message: "کالا زیاد شد" })




    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

export default router