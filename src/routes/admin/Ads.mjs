import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthBoss, checkAuthUser } from "../../utils/authValid.mjs";
const prisma = new PrismaClient();

router.get('/api/admin/Ads/all', checkAuthAdmin, async (req, res) => {
    try {
        const data = await prisma.advertisement.findMany({ include: { _count: true } })
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.patch('/api/admin/Ads/Have', async (req, res) => {
    try {
        let { phone } = req.body
        if (!phone) { phone = req.clientIp }
        let WasSeen = await prisma.advertisement_seen.findMany({ where: { userId: phone } })
        WasSeen = WasSeen.map(el => el.adId)
        const data = await prisma.advertisement.findMany({ where: { NOT: { id: { in: WasSeen } } } })
        res.status(200).send(data[0])
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.patch('/api/admin/Ads/Seen', async (req, res) => {
    try {
        let { id, phone } = req.body
        if (!phone) { phone = req.clientIp }
        await prisma.advertisement_seen.create({ data: { adId: id, userId: phone } })
        res.status(201).send(req.clientIp)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.post('/api/admin/Ads/add', checkAuthAdmin, async (req, res) => {
    try {
        const data = await req.body
        await prisma.advertisement.create({ data })
        res.status(201).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})

router.delete('/api/admin/Ads/delete/:id', checkAuthAdmin, async (req, res) => {
    try {
        const { id } = await req.params
        await prisma.advertisement.delete({ where: { id } })
        res.status(201).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.put('/api/admin/Ads/update', checkAuthAdmin, async (req, res) => {
    try {
        const data = await req.body
        await prisma.advertisement.update({ data, where: { id: data.id } })
        res.status(201).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


export default router