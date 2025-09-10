import { Router } from "express";
const router = Router()
import { Prisma, PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthBoss, checkAuthUser, checkAuthUserBuy } from "../../utils/authValid.mjs";
import { SendEmail } from '../../utils/email.mjs'
import { convertToSheet } from "../../utils/excelConvert.mjs";
import { subDays, subMonths } from "date-fns";
import { otpStore } from "../../../app.mjs";
import { SendSms } from "../../utils/sendSms.mjs";
const prisma = new PrismaClient()
router.get("/api/admin/orderManage/list", checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user

        // ["dateUp","dateDown","priceUp","priceDown"]
        let { id, maxPrice, minPrice, minDate, maxDate, rowPer, page, sort } = req.query
        let data = await prisma.orders.findMany({ where: { product: { userId: phone } } })


        // data = FilterCustom(data, "amount", "insertDate", maxPrice, minPrice, minDate, maxDate)
        // data = PageinationCustom(data, rowPer, page)
        // data = SortCustom(data, sort, "insertDate", "amount")

        // if (id) { data = data.filter(el => el.ref_id == id || el.orderId == id || el.card_pan.indexOf(id) > -1) }
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/admin/orderManage/order/:id", checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params

        let data = await prisma.orders.findFirst({ where: { id }, include: { user: true,orderProduct:{include:{products:{include:{user:true}}}}, jedgement: { include: { order: true } }, tickets: { include: { ticket_Message: true } }, trasactions: true } })
        data["product"]=data.orderProduct[0].products
        
        data["moreInformation"]={
            buyerName:data?.user.name||"بدون نام",
            SellerName:data.product.user.name||"بدون نام",

        }
        data.product.user=undefined
        data["user"] = undefined

        const order = await prisma.orderTiming.findFirst({ where: { id } })
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


        const resMessage = {
            messages, canCancel: false, canFnish: false, canNorecieve: false, time: order.create
            , trackingCode: data.trackCode
        }

        data["resMessage"] = resMessage
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

export default router