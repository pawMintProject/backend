import { Router } from "express";
const router = Router()
import { PrismaClient } from "@prisma/client"
import { checkAuthAdmin, checkAuthBoss, checkAuthUser } from "../../utils/authValid.mjs";
const prisma = new PrismaClient();

const roles = [
    { id: 1, name: "ادمین" },
    { id: 5, name: "مدیر" },
]
router.get('/api/admin/role/all', checkAuthAdmin, async (req, res) => {
    try {
        const { query } = req.query
        const data = await prisma.roles.findMany({
            include: { user: true }, where: {
                userId: {
                    contains: query ? String(query) : undefined, // Case-sensitive search
                },
            }
        })
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.put('/api/admin/role/update', checkAuthAdmin, async (req, res) => {
    try {
        const body = await req.body
        await prisma.roles.update({ where: { id: body.id }, data: { role: body.role } })
        await prisma.user.update({ where: { phone: body.phone }, data: { email: body.email } })
        res.status(200).send("")
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.post('/api/admin/role/add', checkAuthAdmin, async (req, res) => {
    try {
        const { phone, role } = await req.body
        const data = await prisma.roles.create({ data: { user: { connect: { phone } }, role } })
        res.status(200).send({ phone, data })
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/admin/role/levels', checkAuthAdmin, async (req, res) => {
    try {
        res.status(200).send(roles)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.get('/api/admin/role/byId/:userId', checkAuthAdmin, async (req, res) => {
    try {
        const { userId } = req.params
        const data = await prisma.roles.findFirst({ where: { id: userId }, include: { user: true } })
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
router.delete('/api/admin/role/delete/:roleId', checkAuthBoss, async (req, res) => {
    try {
        const { roleId } = req.params
        const data = await prisma.roles.delete({ where: { id: roleId } })
        res.status(200).send(data)
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})


export default router