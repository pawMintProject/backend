import { Router } from "express";
const router = Router()
import { Prisma, PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthBoss, checkAuthUser, checkAuthUserBuy } from "../../utils/authValid.mjs";
import { SendEmail } from '../../utils/email.mjs'
import { convertToSheet } from "../../utils/excelConvert.mjs";
import { subDays, subMonths } from "date-fns";
import { ExpireOtp, otpStore } from "../../../app.mjs";
import { SendSms } from "../../utils/sendSms.mjs";
import { FilterCustom, PageinationCustom, SortCustom } from "../../utils/filterSystem.mjs";
const prisma = new PrismaClient()

router.get("/api/admin/incomeManage/all/mine", checkAuthUser, async (req, res) => {
    try {

        let { phone } = req.user
        let data = await prisma.sellerIncome.findMany({ where: { userId: phone } })

        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get("/api/admin/incomeManage/all/waitMine", checkAuthUser, async (req, res) => {
    try {

        let { phone } = req.user
        let data = await prisma.sellerIncome.findMany({ where: { userId: phone, status: "waiting" } })

        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/admin/incomeManage/all/list", checkAuthAdmin, async (req, res) => {
    try {

        let { id, maxPrice, minPrice, minDate, maxDate, rowPer, page, sort, type } = req.query
        let data = await prisma.sellerIncome.findMany()

        data = FilterCustom(data, "amount", "insertDate", maxPrice, minPrice, minDate, maxDate)
        data = PageinationCustom(data, rowPer, page)
        data = SortCustom(data, sort, "insertDate", "amount")

        if (id) { data = data.filter(el => el.id == id || el.userId == id || el.payCode == id || el.wallet.indexOf(id) > -1) }
        if (type) { data = data.filter(el => el.status == type) }
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.post("/api/admin/incomeManage/all/add/:code", checkAuthAdmin, async (req, res) => {
    try {

        let { userId, amount } = req.body
        const { code } = req.params
        const { phone } = req.user
        // otpStore[phone]?.otp == code
        if (otpStore[phone]?.otp == code) {
            ExpireOtp(phone)
            const user = await prisma.user.findFirst({ where: { phone: userId } })
            await prisma.sellerIncome.create({ data: { userId, amount, wallet: user.walletNumber } })

            const roles = await prisma.roles.findMany({ where: { role: 7 }, include: { user: true } })
            for (let index = 0; index < roles.length; index++) {
                const element = roles[index];
                user.email && await SendEmail(`مدیر گرامی هشدار <br> دستور واریز دستی به مبلغ ${amount} و به حساب ${user.walletNumber} صادر شده است اگر درخواست شما نبوده سریعا اقدام کنید`, element.user.email, element.userId)
                await SendSms(element.userId, `مدیر گرامی هشدار /n دستور واریز دستی به مبلغ ${amount} و به حساب ${user.walletNumber} صادر شده است اگر درخواست شما نبوده سریعا اقدام کنید`)
            }
            await SendSms(userId, `کاربر گرامی ${userId} به مبلغ ${amount} واریز دستی برای شما صادر شد`)
            res.status(200).send("")
        } else {
            res.status(400).send("کد اشتباه است")
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.patch("/api/admin/incomeManage/all/accept/:id/:time/:code", checkAuthAdmin, async (req, res) => {
    try {

        const { id, time, code } = req.params
        const income = await prisma.sellerIncome.findFirst({ where: { id }, include: { user: true } })
        if (income.status == "waiting") {
            await prisma.sellerIncome.update({ where: { id }, data: { status: "success", statusMessage: "accepted manually", payDate: time, payCode: code } })

            income.user.email && await SendEmail(`مبلغ ${income.amount} به حساب شما بطور دستی واریز شد`, income.user.email, income.userId)

            await SendSms(income.userId, `مبلغ ${income.amount} به حساب شما بطور دستی واریز شد`)
            res.status(200).send("")
        } else {
            res.status(400).send("در گذشته عملیاتی انجام شده")
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.patch("/api/admin/incomeManage/all/reject/:id", checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        const income = await prisma.sellerIncome.findFirst({ where: { id }, include: { user: true } })
        if (income.status == "waiting") {
            await prisma.sellerIncome.update({ where: { id }, data: { status: "reject", statusMessage: "rejected-manually" } })

            income.user.email && await SendEmail(`مبلغ ${income.amount} به حساب شما با ایدی ${id} بطور دستی ریجکت شد`, income.user.email, income.userId)
            await SendSms(income.userId, `مبلغ ${income.amount} به حساب شما با ایدی ${id} بطور دستی ریجکت شد`)
            await prisma.user.update({ where: { phone: income.userId }, data: { money: (parseInt(income.user.money) + income.amount).toString } })
            res.status(200).send("")
        } else {
            res.status(400).send("در گذشته عملیاتی انجام شده")
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/admin/incomeManage/all/export/:time/:type", checkAuthAdmin, async (req, res) => {
    try {
        let name = new Date()
        name = name.getTime()
        // ["dateUp","dateDown","priceUp","priceDown"]
        let { time, type } = req.params
        let data = await prisma.sellerIncome.findMany()
        if (type != "all") { data = data.filter(el => el.status == type) }
        data = FilterCustom(data, null, "insertDate", null, null, new Date(time), new Date())
        const excel = convertToSheet(data, `assets/upload/logs/export-manual-income-${type}-admin-${name}.xlsx`)
        res.status(200).send(`${req.get('host')}/files/upload/logs/export-manual-income-${type}-admin-${name}.xlsx`)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);

    }
})
router.get("/api/admin/incomeManage/waitCheck1/list", checkAuthAdmin, async (req, res) => {
    try {

        let { id, maxPrice, minPrice, minDate, maxDate, rowPer, page, sort, type } = req.query
        let data = await prisma.sellerIncome.findMany({ where: { statusMessage: "reject-high-amount-waitingList" } })
        data = FilterCustom(data, "amount", "insertDate", maxPrice, minPrice, minDate, maxDate)
        data = PageinationCustom(data, rowPer, page)
        data = SortCustom(data, sort, "insertDate", "amount")
        if (id) { data = data.filter(el => el.id == id || el.userId == id || el.payCode == id || el.wallet.indexOf(id) > -1) }
        // if (type) { data = data.filter(el => el.status == type) }
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.patch("/api/admin/incomeManage/waitCheck1/accept/:id", checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        const income = await prisma.sellerIncome.findFirst({ where: { id }, include: { user: true } })
        if (income.status == "waiting" && income.statusMessage == "reject-high-amount-waitingList") {
            await prisma.sellerIncome.update({ where: { id }, data: { accept: true, statusMessage: "wait-user-check" } })
            income.user.email && await SendEmail(`واریز مبلغ ${income.amount} تومان به حساب شما تایید شد 
ظرف ۲۴ ساعت آینده مبلغ فوق به حساب شما واریز می‌گردد.`, income.user.email, income.userId)
            await SendSms(income.userId, `واریز مبلغ ${income.amount} تومان به حساب شما تایید شد 
ظرف ۲۴ ساعت آینده مبلغ فوق به حساب شما واریز می‌گردد.`)
            res.status(200).send("")
        } else {
            res.status(400).send("در گذشته عملیاتی انجام شده")
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.patch("/api/admin/incomeManage/waitCheck1/reject/:id", checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        const income = await prisma.sellerIncome.findFirst({ where: { id }, include: { user: true } })
        if (income?.status == "waiting" && income.statusMessage == "reject-high-amount-waitingList") {
            await prisma.sellerIncome.update({ where: { id }, data: { accept: true, statusMessage: "reject-high-amount-waitingList-reject-manually", status: "fail" } })
            income.user.email && await SendEmail(`درخواست واریز شما به مبلغ ${income.amount} رد شد`, income.user.email, income.userId)
            await SendSms(income.userId, `درخواست واریز شما به مبلغ ${income.amount} رد شد`)
            await prisma.user.update({ where: { phone: income.userId }, data: { money: (parseInt(income.user.money) + income.amount).toString() } })
            res.status(200).send("")
        } else {
            res.status(400).send("در گذشته عملیاتی انجام شده")
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.patch("/api/user/incomeManage/waitCheck1/otp/:id/:code", checkAuthAdmin, async (req, res) => {
    try {

        const { id, code } = req.params
        const income = await prisma.sellerIncome.findFirst({ where: { id }, include: { user: true } })
        if (otpStore[income.userId].otp == code && income.statusMessage == "reject-high-amount-wait-otp-auth") {
            await prisma.sellerIncome.update({ where: { id }, data: { accept: true, statusMessage: "wait-user-check" } })

            income.user.email && await SendEmail(`درخواست واریز شما به ایدی ${id} و به ایدی ${income.amount} در تاریخ - با otp تایید شد`, income.user.email, income.userId)
            await SendSms(income.userId, `درخواست واریز شما به ایدی ${id} و به ایدی ${income.amount} در تاریخ - با otp تایید شد`)
            res.status(200).send("")
        } else {
            res.status(400).send("در گذشته عملیاتی انجام شده یا کد اشتباه است")
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
// -------------------------------------------------------------------------- STEP-2------------------------------




router.get("/api/admin/incomeManage/waitCheck2/list", checkAuthAdmin, async (req, res) => {
    try {

        let { id, maxPrice, minPrice, minDate, maxDate, rowPer, page, sort, type } = req.query
        let data = await prisma.sellerIncome.findMany({ where: { statusMessage: "reject-not-accepted-user" } })
        data = FilterCustom(data, "amount", "insertDate", maxPrice, minPrice, minDate, maxDate)
        data = PageinationCustom(data, rowPer, page)
        data = SortCustom(data, sort, "insertDate", "amount")
        if (id) { data = data.filter(el => el.id == id || el.userId == id || el.payCode == id || el.wallet.indexOf(id) > -1) }
        // if (type) { data = data.filter(el => el.status == type) }
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.patch("/api/admin/incomeManage/waitCheck2/accept/:id", checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        const income = await prisma.sellerIncome.findFirst({ where: { id }, include: { user: true } })
        if (income.status == "waiting" && income.statusMessage == "reject-not-accepted-user") {
            await prisma.sellerIncome.update({ where: { id }, data: { accept: true, statusMessage: "reject-not-accepted-user-accept-manually" } })
            income.user.email && await SendEmail(`درخواست واریز شما به مبلغ ${income.amount} به صورت دستی پس از ریجکت خودکار تایید شد`, income.user.email, income.userId)
            await SendSms(income.userId, `درخواست واریز شما به مبلغ ${income.amount} به صورت دستی پس از ریجکت خودکار تایید شد`)
            res.status(200).send("")
        } else {
            res.status(400).send("در گذشته عملیاتی انجام شده")
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.patch("/api/admin/incomeManage/waitCheck2/reject/:id", checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        const income = await prisma.sellerIncome.findFirst({ where: { id }, include: { user: true } })
        if (income.status == "waiting" && income.statusMessage == "reject-not-accepted-user") {
            await prisma.sellerIncome.update({ where: { id }, data: { accept: true, statusMessage: "reject-not-accepted-user-reject-manually" } })
            income.user.email && await SendEmail(`درخواست واریز شما به مبلغ ${income.amount} به صورت دستی پس از ریجکت خودکار رد شد`, income.user.email, income.userId)
            await SendSms(income.userId, `درخواست واریز شما به مبلغ ${income.amount} به صورت دستی پس از ریجکت خودکار رد شد`)
            await prisma.user.update({ where: { phone: income.userId }, data: { money: (parseInt(income.user.money) + income.amount).toString() } })
            res.status(200).send("")
        } else {
            res.status(400).send("در گذشته عملیاتی انجام شده")
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

//--------------------------------------------------------  Accepted user part 
router.get("/api/admin/incomeManage/acceptedList/list", checkAuthAdmin, async (req, res) => {
    try {
        const user = await prisma.authorizedUser.findMany()
        res.status(200).send(user)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.patch("/api/admin/incomeManage/acceptedList/add/:id", checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        await prisma.authorizedUser.create({ data: { phone: id } })
        res.status(200).send("")

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.delete("/api/admin/incomeManage/acceptedList/delete/:id", checkAuthAdmin, async (req, res) => {
    try {

        const { id } = req.params
        await prisma.authorizedUser.delete({ where: { phone: id } })
        res.status(200).send("")

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})





//-------------setting
router.patch("/api/admin/incomeManage/setting/AccessPrice/:price", checkAuthAdmin, async (req, res) => {
    try {

        const { price } = req.params
        const data = await prisma.setting.update({ where: { id: 1 }, data: { value: price } })
        res.status(200).send(data.value)

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


router.patch("/api/admin/incomeManage/setting/needCodePrice/:price", checkAuthAdmin, async (req, res) => {
    try {

        const { price } = req.params
        const data = await prisma.setting.update({ where: { id: 1 }, data: { value: price } })
        res.status(200).send(data.value)

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
//AccessPrice id is 1 in db
//needCodePrice id is 2 in db















































































router.get("/api/admin/incomeManage/waitForPayManual/:id", checkAuthAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const data = await prisma.sellerIncome.findFirst({ where: { id } })
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})





router.get("/api/admin/incomeManage/waitForPayManual", checkAuthAdmin, async (req, res) => {
    try {
        const data = await prisma.sellerIncome.findMany({ where: { statusMessage: "wait-user-check", accept: true } })
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.post("/api/admin/incomeManage/waitForPayManual", checkAuthAdmin, async (req, res) => {
    try {
        const { id, time, code } = req.body
        const data = await prisma.sellerIncome.findFirst({ where: { id }, include: { user: true } })
        await prisma.sellerIncome.update({ where: { statusMessage: "wait-user-check", accept: true, id }, data: { statusMessage: "paid", status: "success", payCode: code.toString(), payDate: new Date(time) } })
        await SendSms(data.userId, `مبلغ ${data.amount} به حساب ${data.wallet} واریز شد`)
        data.user.email && await SendEmail(`مبلغ ${data.amount} به حساب ${data.wallet} واریز شد`, data.user.email, data.userId)
        res.status(200).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


























export default router