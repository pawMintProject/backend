import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthBoss, checkAuthUser } from "../../utils/authValid.mjs";
import { SendEmail } from '../../utils/email.mjs'
import { convertToSheet } from "../../utils/excelConvert.mjs";
import { subDays, subMonths } from "date-fns";
import { ExpireOtp, otpStore } from "../../../app.mjs";
import { SendSms } from "../../utils/sendSms.mjs";
import { FilterCustom, PageinationCustom, SortCustom } from "../../utils/filterSystem.mjs";
import axios from "axios";
const prisma = new PrismaClient()
async function checkLiara() {

    const api1 = await axios.get("https://api.iran.liara.ir/v1/projects/sotpay?teamID=67d6b1d3e730c59dcab7f49c", {
        headers: {
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2NzY5NWY3ZDEyMmVhNzVkYzIxMDRlNzUiLCJ0eXBlIjoiYXV0aCIsImlhdCI6MTc0MzAxMzc0NX0.3bveR4Gi62e-wFqVevVeCyk8AHCiF6-vQF9j54DRQr0",
            "Content-Type": "application/json",
        }
    })
    const Backend = await api1.data.project
    const monthlyBackend = await (Backend.bundleHourlyPrice + Backend.hourlyPrice) * 24 * 30
    const api2 = await axios.get("https://api.iran.liara.ir/v1/projects/sootpay?teamID=67d6b1d3e730c59dcab7f49c", {
        headers: {
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2NzY5NWY3ZDEyMmVhNzVkYzIxMDRlNzUiLCJ0eXBlIjoiYXV0aCIsImlhdCI6MTc0MzAxMzc0NX0.3bveR4Gi62e-wFqVevVeCyk8AHCiF6-vQF9j54DRQr0",
            "Content-Type": "application/json",
        }
    })
    const FrontEnd = await api2.data.project
    const monthlyFront = await (FrontEnd.bundleHourlyPrice + FrontEnd.hourlyPrice) * 24 * 30
    const api3 = await axios.get("https://api.liara.ir/v1/databases/67d6f362a536dd80b0b4040e?teamID=67d6b1d3e730c59dcab7f49c", {
        headers: {
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2NzY5NWY3ZDEyMmVhNzVkYzIxMDRlNzUiLCJ0eXBlIjoiYXV0aCIsImlhdCI6MTc0MzAxMzc0NX0.3bveR4Gi62e-wFqVevVeCyk8AHCiF6-vQF9j54DRQr0",
            "Content-Type": "application/json",
        }
    })
    const Db = await api3.data.database
    const monthlyDb = await (Db.bundleHourlyPrice + Db.hourlyPrice) * 24 * 30
    const api4 = await axios.get("https://api.liara.ir/v1/me?teamID=67d6b1d3e730c59dcab7f49c", {
        headers: {
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2NzY5NWY3ZDEyMmVhNzVkYzIxMDRlNzUiLCJ0eXBlIjoiYXV0aCIsImlhdCI6MTc0MzAxMzc0NX0.3bveR4Gi62e-wFqVevVeCyk8AHCiF6-vQF9j54DRQr0",
            "Content-Type": "application/json",
        }
    })


    const balance = await api4.data.team.balance
    const api5 = await axios.get("https://mail-service.liara.ir/api/v1/mails?teamID=67d6b1d3e730c59dcab7f49c", {
        headers: {
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2NzY5NWY3ZDEyMmVhNzVkYzIxMDRlNzUiLCJ0eXBlIjoiYXV0aCIsImlhdCI6MTc0MzAxMzc0NX0.3bveR4Gi62e-wFqVevVeCyk8AHCiF6-vQF9j54DRQr0",
            "Content-Type": "application/json",
        }
    })


    const emailServer = await api5.data
    const plan = emailServer.data.mailServers[0].plan
    const api6 = await axios.get("https://mail-service.liara.ir/api/v1/mails/67e126a07d68817568e4f1c7/metrics?teamID=67d6b1d3e730c59dcab7f49c", {
        headers: {
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2NzY5NWY3ZDEyMmVhNzVkYzIxMDRlNzUiLCJ0eXBlIjoiYXV0aCIsImlhdCI6MTc0MzAxMzc0NX0.3bveR4Gi62e-wFqVevVeCyk8AHCiF6-vQF9j54DRQr0",
            "Content-Type": "application/json",
        }
    })


    const emailServerCo = await api6.data
    const usedEmailPlan = emailServerCo
    // .mailServers[0].plan
    // console.log(plan,"--")
    // 
    const monthlyAllPrice = monthlyBackend + monthlyDb + monthlyFront + plan.price
    const haveDay = Math.round(balance / (monthlyAllPrice / 30))
    return { monthlyBackend, monthlyFront, monthlyDb, balance, monthlyAllPrice, emailPlan: plan, usedEmailPlan, haveDay }

}


router.get("/api/admin/dashboard/status", checkAuthAdmin, async (req, res) => {
    try {
        // await prisma.orders.deleteMany()

        const time = subDays(new Date(), 30)

        // const liara=checkLiara()
        let allPrice = 0
        let pureIncome = 0
        let safePrice = 0
        let AllSellAmount = 0;
        let AllTodayAmount = 0;
        let orders = await prisma.orders.findMany({ where: { payStatus: "success", NOT: { finish: "fial" } } })
        orders.filter(el => el.insertTime > time)
        orders.forEach(el => allPrice += parseInt(el.finalCost))
        orders.forEach(el => pureIncome += el.fee)
        let CurrentoOrders = await prisma.orders.findMany({ where: { finish: "waiting", payStatus: "success" } })
        CurrentoOrders.filter(el => el.insertTime > time)
        CurrentoOrders.forEach(el => safePrice += parseInt(el.price))




        // let incomes = await prisma.sellerIncome.findMany({ where: { status: "success" } })
        let transAction = await prisma.trasactions.findMany({ select: { amount: true, insertDate: true } })

        transAction.filter(el => el.insertDate > time)
        transAction.forEach(el => AllSellAmount += el.amount)

        const time2 = subDays(new Date(), 1)

        transAction.filter(el => el.insertDate > time2)
        transAction.forEach(el => AllTodayAmount += parseInt(el.amount))




        let chartData = await prisma.orders.findMany({ where: {} })
        chartData.filter(el => el.insertTime > time)

        const customChart = await ChartCustom(chartData, 30, true, "finalCost")

        res.status(202).send({ allPrice, safePrice, pureIncome, customChart, AllSellAmount, AllTodayAmount })
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})



router.get("/api/admin/dashboard/users/status", checkAuthAdmin, async (req, res) => {
    try {
        // await prisma.orders.deleteMany()

        const time = subDays(new Date(), 30)
        const time2 = subMonths(new Date(), 7)

        let users = await prisma.user.findMany()
        let sellers = await prisma.user.findMany({ where: { isSeller: true }, select: { phone: true, name: true, _count: { select: { orders: true } } } })
        sellers.sort((a, b) => b._count.orders - a._count.orders)
        let logs = await prisma.routineLog.findMany()
        let monthly = logs.filter(el => el.id > time2)
        let daily = logs.filter(el => el.id > time)
        res.status(202).send({ usersCount: users.length, sellers, monthly, daily })
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


router.get("/api/admin/transActions/all", checkAuthAdmin, async (req, res) => {
    try {
        // ["dateUp","dateDown","priceUp","priceDown"]
        let { id, maxPrice, minPrice, minDate, maxDate, rowPer, page, sort } = req.query
        let data = await prisma.trasactions.findMany()


        data = FilterCustom(data, "amount", "insertDate", maxPrice, minPrice, minDate, maxDate)
        data = PageinationCustom(data, rowPer, page)
        data.sort((a, b) => a.amount - b.amount)

        if (id) { data = data.filter(el => el.ref_id == id || el.orderId == id || el.card_pan.indexOf(id) > -1) }
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get("/api/admin/transActions/list", checkAuthAdmin, async (req, res) => {
    try {
        // ["dateUp","dateDown","priceUp","priceDown"]
        let { id, maxPrice, minPrice, minDate, maxDate, rowPer, page, sort } = req.query
        let data = await prisma.trasactions.findMany()


        data = FilterCustom(data, "amount", "insertDate", maxPrice, minPrice, minDate, maxDate)
        data = PageinationCustom(data, rowPer, page)
        data = SortCustom(data, sort, "insertDate", "amount")

        if (id) { data = data.filter(el => el.ref_id == id || el.orderId == id || el.card_pan.indexOf(id) > -1) }
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get("/api/admin/transActions/CurrentList", checkAuthAdmin, async (req, res) => {
    try {
        // ["dateUp","dateDown","priceUp","priceDown"]
        let { id, maxPrice, minPrice, minDate, maxDate, rowPer, page, sort } = req.query
        let data = await prisma.sellerIncome.findMany()


        data = FilterCustom(data, "amount", "insertDate", maxPrice, minPrice, minDate, maxDate)
        data = PageinationCustom(data, rowPer, page)
        data = SortCustom(data, sort, "insertDate", "amount")

        if (id) { data = data.filter(el => el.ref_id == id || el.orderId == id || el.card_pan.indexOf(id) > -1) }
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get("/api/admin/orders/current", checkAuthAdmin, async (req, res) => {
    try {
        // ["dateUp","dateDown","priceUp","priceDown"]
        let { id, maxPrice, minPrice, minDate, maxDate, rowPer, page, sort } = req.query
        let data = await prisma.orders.findMany({ where: { payStatus: "success", finish: "waiting" } })


        data = FilterCustom(data, "finalCost", "insertTime", maxPrice, minPrice, minDate, maxDate)
        data = PageinationCustom(data, rowPer, page)
        data = SortCustom(data, sort, "insertTime", "finalCost")

        if (id) { data = data.filter(el => el.userId == id || el.orderId == id) }
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})



router.get("/api/admin/transactions/pure", checkAuthAdmin, async (req, res) => {
    try {
        // ["dateUp","dateDown","priceUp","priceDown"]
        let { id, maxPrice, minPrice, minDate, maxDate, rowPer, page, sort } = req.query
        let data = await prisma.orders.findMany({ where: { payStatus: "success" } })


        data = FilterCustom(data, "finalCost", "insertTime", maxPrice, minPrice, minDate, maxDate)
        data = PageinationCustom(data, rowPer, page)
        data = SortCustom(data, sort, "insertTime", "finalCost")

        if (id) { data = data.filter(el => el.userId == id || el.orderId == id) }
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})



router.get("/api/admin/orders/canceled", checkAuthAdmin, async (req, res) => {
    try {
        // ["dateUp","dateDown","priceUp","priceDown"]
        let { id, maxPrice, minPrice, minDate, maxDate, rowPer, page, sort } = req.query
        let data = await prisma.orders.findMany({ where: { finish: "fail" } })


        data = FilterCustom(data, "finalCost", "insertTime", maxPrice, minPrice, minDate, maxDate)
        data = PageinationCustom(data, rowPer, page)
        data = SortCustom(data, sort, "insertTime", "finalCost")

        if (id) { data = data.filter(el => el.userId == id || el.orderId == id) }
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get("/api/admin/orders/wait", checkAuthAdmin, async (req, res) => {
    try {
        // ["dateUp","dateDown","priceUp","priceDown"]
        let { id, maxPrice, minPrice, minDate, maxDate, rowPer, page, sort } = req.query
        let data = await prisma.orders.findMany({ where: { finish: "waiting", payStatus: "success", sellAccept: false } })


        data = FilterCustom(data, "finalCost", "insertTime", maxPrice, minPrice, minDate, maxDate)
        data = PageinationCustom(data, rowPer, page)
        data = SortCustom(data, sort, "insertTime", "finalCost")


        if (id) { data = data.filter(el => el.userId == id || el.orderId == id) }
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get("/api/admin/orders/finished", checkAuthAdmin, async (req, res) => {
    try {
        // ["dateUp","dateDown","priceUp","priceDown"]
        let { id, maxPrice, minPrice, minDate, maxDate, rowPer, page, sort } = req.query
        let data = await prisma.orders.findMany({ where: { finish: "success", payStatus: "success", sellAccept: true } })


        data = FilterCustom(data, "finalCost", "insertTime", maxPrice, minPrice, minDate, maxDate)
        data = PageinationCustom(data, rowPer, page)
        data = SortCustom(data, sort, "insertTime", "finalCost")

        if (id) { data = data.filter(el => el.userId == id || el.orderId == id) }
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get("/api/admin/transActions/status", checkAuthAdmin, async (req, res) => {
    try {
        const time = subDays(new Date(), 30)
        let wait = 0
        let canceled = 0
        let finished = 0
        let current = 0
        let finishedData = await prisma.orders.findMany({ where: { payStatus: "success", finish: "success", sellAccept: true } })
        finishedData.filter(el => el.insertTime > time)
        finishedData.forEach(el => finished += 1)

        let canceledData = await prisma.orders.findMany({ where: { finish: "fail" } })
        canceledData.filter(el => el.insertTime > time)
        canceledData.forEach(el => canceled += 1)

        let waitData = await prisma.orders.findMany({ where: { finish: "waiting", payStatus: "success", sellAccept: false } })

        waitData.forEach(el => wait += 1)


        let currentData = await prisma.orders.findMany({ where: { finish: "waiting", payStatus: "success" } })

        currentData.forEach(el => current += 1)


        res.status(200).send({ finished, canceled, wait, current })
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


router.get("/api/seller/transActions/main/all", checkAuthUser, async (req, res) => {
    try {
        // ["dateUp","dateDown","priceUp","priceDown"]
        const { phone } = req.user
        let { id } = req.query
        const user = await prisma.user.findFirst({ where: { phone } })
        let actions = await prisma.trasactions.findMany({ where: { order: { product: { userId: phone } } }, include: { order: { include: { product: true } } } })
        let orders = await prisma.orders.findMany({ where: { product: { userId: phone } }, include: { trasactions: true } })
        const waitSupply = await orders.filter(el => el.sellAccept == false && el.payed == true && el.finish == "waiting").length
        const finished = await orders.filter(el => el.sellAccept == true && el.payed == true && el.finish == "success")
        let allIncome = 0;
        finished.map(el => allIncome += el.price + el.sendPrice)
        let monthIncome = 0;
        const now = new Date()
        const monthTime = subMonths(now, 1)
        orders.map(el => { if (new Date(el.trasactions?.insertDate) > monthTime) { monthIncome += el.price + el.sendPrice } })
        let chartMonthlyIncome = []
        orders.forEach(el => {
            let send = {}
            send["amount"] = el.price + el.sendPrice
            send["insertTime"] = el.trasactions?.insertDate

            chartMonthlyIncome.push(send)
        })
        let sendData = {
            waitSupply: waitSupply,
            finished: finished.length,
            allIncome,
            wallet: user.money,
            monthIncome,
            chartSell: (finished, 7),
            chartIncome: ChartCustom(chartMonthlyIncome, 30, true, "amount"),

        }

        res.status(200).send(sendData)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


function ChartCustom(data, time, moeny, moneyName) {
    const send = {}
    // console.log(data,new Date())
    for (let el = 1; el < time + 1; el++) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        startOfDay.setDate(startOfDay.getDate() - el);

        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const filteredItems = data.filter(item => new Date(item.insertTime) >= startOfDay && new Date(item.insertTime) < endOfDay
        );
        if (moeny) {
            let amount = 0
            filteredItems.forEach(el => { amount += parseInt(el[moneyName]) })
            send[`day${el}Ego`] = amount
        } else {
            send[`day${el}Ego`] = filteredItems.length
        }



    }

    return send
}



// && ;





router.get("/api/admin/transActions/export/:time", checkAuthAdmin, async (req, res) => {
    try {
        let name = new Date()
        name = name.getTime()
        // ["dateUp","dateDown","priceUp","priceDown"]
        let { time } = req.params
        let data = await prisma.trasactions.findMany()


        data = FilterCustom(data, null, "insertDate", null, null, new Date(time), new Date())
        const excel = convertToSheet(data, `assets/upload/logs/export-manual-transAction-admin-${name}.xlsx`)

        res.status(200).send(`${req.get('host')}/files/upload/logs/export-manual-transAction-admin-${name}.xlsx`)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);

    }
})

router.patch("/api/admin/transActions/income", checkAuthUser, async (req, res) => {
    try {
        const { phone } = req.user
        console.log("first", phone)


        const user = await prisma.user.findFirst({ where: { phone } })
        if (user.walletHolder && user.walletNumber) {
            if (user.money > 500000) {

                await prisma.user.update({ where: user, data: { money: "0" } })
                await prisma.sellerIncome.create({ data: { amount: parseFloat(user.money), wallet: user.walletNumber, userId: phone } })
                user.email && await SendEmail(`درخواست ثبت برداشت شما به حساب ${user.walletNumber} با مبلغ ${user.money} ثبت شد`, user.email, phone)
                await SendSms(phone,  `درخواست ثبت برداشت شما به حساب ${user.walletNumber} با مبلغ ${user.money} ثبت شد`)

                res.status(201).send("")
            } else {
                res.status(400).send("موجودی شما کم است")

            }
        } else {
            res.status(400).send("اطلاعات شما کافی نیست")
        }




    } catch (error) {
        console.log(error)
        res.status(500).send(error);

    }
})




export default router
