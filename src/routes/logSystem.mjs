import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthBoss, checkAuthUser } from "../utils/authValid.mjs";
const prisma = new PrismaClient();
import { FilterCustom, PageinationCustom, SortCustom } from "../utils/filterSystem.mjs";
import { SendEmail } from "../utils/email.mjs";
router.get('/api/logSystem/email/all', checkAuthAdmin, async (req, res) => {
    try {
        let { id, minDate, maxDate } = req.query
        let data = await prisma.userEmailsSended.findMany()
        data = FilterCustom(data, "amount", "insertTime", undefined, undefined, minDate, maxDate)
        
        if (id) { data = data.filter(el => el.id == id || el.userId == id || el.content.indexOf(id) > -1) }

        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.get('/api/logSystem/logs/all', checkAuthAdmin, async (req, res) => {
    try {
        let { id, minDate, maxDate } = req.query
        let data = await prisma.logUser.findMany()
        data = FilterCustom(data, "amount", "insertTime", undefined, undefined, minDate, maxDate)
        
        if (id) { data = data.filter(el => el.id == id || el.userId == id || el.content.indexOf(id) > -1) }

        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
export default router